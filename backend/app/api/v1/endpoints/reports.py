from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import StreamingResponse
from datetime import datetime
from typing import Optional
from io import BytesIO

from app.utils.dependencies import get_current_user
from app.models.transaction import Transaction

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

router = APIRouter(prefix="/reports", tags=["reports"])

@router.get("/download")
async def download_summary_report(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    bank: Optional[str] = Query(None),
    user = Depends(get_current_user)
):
    user_id = str(user["user_id"])
    
    match_stage = {"user_id": user_id}
    
    if bank and bank != "All Banks":
        match_stage["bank"] = {"$regex": bank, "$options": "i"}

    if start_date or end_date:
        date_filter = {}
        try:
            if start_date:
                date_filter["$gte"] = datetime.fromisoformat(start_date.replace("Z", "+00:00"))
            if end_date:
                dt_end = datetime.fromisoformat(end_date.replace("Z", "+00:00"))
                date_filter["$lte"] = dt_end.replace(hour=23, minute=59, second=59, microsecond=999999)
            match_stage["date"] = date_filter
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid date format")

    pipeline = [
        {"$match": match_stage},
        {
            "$facet": {
                "totals": [
                    {"$group": {
                        "_id": None,
                        "income": {"$sum": {"$ifNull": ["$credit", 0]}},
                        "expense": {"$sum": {"$ifNull": ["$debit", 0]}},
                        "count": {"$sum": 1}
                    }}
                ],
                "category_spending": [
                    {"$group": {
                        "_id": {"$ifNull": ["$category", "Uncategorized"]}, 
                        "total": {"$sum": {"$ifNull": ["$debit", 0]}}
                    }},
                    {"$sort": {"total": -1}}
                ],
                "payee_leaderboard": [
                    {"$group": {
                        "_id": "$payee",
                        "total_spent": {"$sum": {"$ifNull": ["$debit", 0]}}
                    }},
                    {"$sort": {"total_spent": -1}},
                    {"$limit": 10}
                ]
            }
        }
    ]

    col = Transaction.get_pymongo_collection()
    cursor = col.aggregate(pipeline)
    docs = await cursor.to_list(length=1)
    res = docs[0] if docs else {}

    totals = res.get("totals", [])
    summary = totals[0] if totals else {"income": 0, "expense": 0, "count": 0}
    
    income = summary.get("income", 0)
    expense = summary.get("expense", 0)
    net = income - expense

    # Generate PDF in memory
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    elements = []
    
    styles = getSampleStyleSheet()
    title_style = styles['Title']
    heading_style = styles['Heading2']
    normal_style = styles['Normal']
    
    # Header
    elements.append(Paragraph("mybalance Executive Summary", title_style))
    elements.append(Spacer(1, 10))
    
    period_str = f"Period: {start_date[:10] if start_date else 'All Time'} to {end_date[:10] if end_date else 'Present'}"
    bank_str = f"Bank: {bank if bank and bank != 'All Banks' else 'All Banks'}"
    elements.append(Paragraph(period_str, normal_style))
    elements.append(Paragraph(bank_str, normal_style))
    elements.append(Spacer(1, 20))
    
    # ── KEY METRICS TABLE ──
    elements.append(Paragraph("Key Performance Indicators", heading_style))
    elements.append(Spacer(1, 10))
    
    kpi_data = [
        ["Total Income", "Total Expenses", "Net Balance", "Transaction Count"],
        [f"INR {income:,.2f}", f"INR {expense:,.2f}", f"INR {net:,.2f}", str(summary.get("count", 0))]
    ]
    
    t_kpi = Table(kpi_data, colWidths=[120, 120, 120, 120])
    t_kpi.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1a3a8f")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor("#f0f2f5")),
        ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('TOPPADDING', (0, 1), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 12),
        ('GRID', (0, 0), (-1, -1), 1, colors.white)
    ]))
    elements.append(t_kpi)
    elements.append(Spacer(1, 30))
    
    # ── CATEGORY BREAKDOWN ──
    elements.append(Paragraph("Expenditure by Category", heading_style))
    elements.append(Spacer(1, 10))
    
    cat_data = [["Category", "Total Spent (INR)", "% of Total Expenses"]]
    for c in res.get("category_spending", []):
        cat_name = c["_id"] if c["_id"] else "Uncategorized"
        amt = c["total"]
        pct = (amt / expense * 100) if expense > 0 else 0
        cat_data.append([cat_name, f"{amt:,.2f}", f"{pct:.1f}%"])
        
    t_cat = Table(cat_data, colWidths=[200, 140, 140])
    t_cat.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#eaecf0")),
        ('TEXTCOLOR', (0,0), (-1,0), colors.black),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('ALIGN', (0,0), (-1,0), 'LEFT'),
        ('ALIGN', (1,0), (-1,-1), 'RIGHT'),
        ('BOTTOMPADDING', (0,0), (-1,0), 6),
        ('LINEBELOW', (0,0), (-1,0), 1, colors.black),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e4e7ec"))
    ]))
    elements.append(t_cat)
    elements.append(Spacer(1, 30))
    
    # ── TOP PAYEES ──
    elements.append(Paragraph("Top 10 Payees / Merchants", heading_style))
    elements.append(Spacer(1, 10))
    
    payee_data = [["Payee / Merchant", "Total Spent (INR)"]]
    for p in res.get("payee_leaderboard", []):
        p_name = p["_id"] if p["_id"] else "Unknown"
        payee_data.append([p_name, f"{p['total_spent']:,.2f}"])
        
    t_payee = Table(payee_data, colWidths=[300, 180])
    t_payee.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#eaecf0")),
        ('TEXTCOLOR', (0,0), (-1,0), colors.black),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('ALIGN', (0,0), (-1,0), 'LEFT'),
        ('ALIGN', (1,0), (-1,-1), 'RIGHT'),
        ('BOTTOMPADDING', (0,0), (-1,0), 6),
        ('LINEBELOW', (0,0), (-1,0), 1, colors.black),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e4e7ec"))
    ]))
    elements.append(t_payee)
    
    # Build
    doc.build(elements)
    buffer.seek(0)
    
    # Generate filename
    sd = start_date[:10] if start_date else "all_time"
    fn = f"mybalance_summary_{sd}.pdf"
    
    return StreamingResponse(
        buffer, 
        media_type="application/pdf", 
        headers={"Content-Disposition": f"attachment; filename={fn}"}
    )
