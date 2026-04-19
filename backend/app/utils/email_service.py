"""
Email utility for subscription billing reminders.
Uses Gmail SMTP via App Password (as configured in .env).
UI styled to match Vaultly globals.css design tokens.
"""
import os
import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

logger = logging.getLogger(__name__)

GMAIL_USER = os.getenv("GMAIL_USER", "")
GMAIL_PASS = os.getenv("GMAIL_PASS", "")

# ── Design tokens pulled from globals.css ───────────────────────────────────
# Currency teal   → #2E7D6B  (oklch 0.530 0.090 168)  — --primary
# Deep engraving  → #1A3D2B  (oklch 0.280 0.075 158)  — --dt-header-to
# Federal green   → #4A8C6F  (oklch 0.610 0.095 162)  — --dt-header-from (approx)
# Note ivory      → #F5F0E8  (oklch 0.958 0.014 88)   — body background
# Parchment       → #E8DFC8  (oklch 0.900 0.030 90)   — card background
# Intaglio khaki  → #C8B88A  (oklch 0.790 0.055 88)   — subtle borders
# Serial red      → #8B2020  (oklch 0.380 0.130 22)   — destructive / accent
# ─────────────────────────────────────────────────────────────────────────────

_COLOR = {
    "bg":              "#F5F0E8",   # note ivory — outer body
    "card":            "#FFFFFF",   # pure white card
    "card_border":     "#C8B88A",   # intaglio khaki border
    "header_from":     "#2E7D6B",   # currency teal
    "header_to":       "#1A3D2B",   # deep engraving
    "header_fg":       "#EAF4F0",   # near-white on teal (--dt-header-fg approx)
    "header_border":   "#4A8C6F",   # federal green
    "body_fg":         "#1C2B22",   # very dark green-black (--foreground feel)
    "label_fg":        "#4A6358",   # muted teal-grey (--muted-foreground feel)
    "amount_fg":       "#2E7D6B",   # primary teal
    "badge_bg":        "#E8DFC8",   # parchment
    "badge_fg":        "#5C3D0E",   # warm dark amber (--badge contrast)
    "divider":         "#D6CCBA",   # light parchment divider
    "row_even":        "#F0EDE5",   # subtle ivory stripe
    "footer_bg":       "#E8DFC8",   # parchment footer
    "footer_fg":       "#7A6E5A",   # muted intaglio
    "accent_line":     "#4A8C6F",   # federal green accent
    "shadow":          "rgba(26,61,43,0.12)",  # deep engraving shadow
}


def send_subscription_reminder(
    to_email: str,
    subscription_name: str,
    amount: float,
    billing_day: int,
    days_before: int,
    currency_symbol: str = "₹",
) -> bool:
    """
    Sends a subscription billing reminder email.
    Returns True if sent successfully, False otherwise.
    """
    if not GMAIL_USER or not GMAIL_PASS:
        logger.warning("GMAIL_USER/GMAIL_PASS not set – skipping email.")
        return False

    subject = f"🔔 Reminder: {subscription_name} charges in {days_before} day(s)"

    html_body = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Vaultly Billing Reminder</title>
      <style>
        /* ── Reset ── */
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}

        body {{
          font-family: 'Georgia', 'Times New Roman', serif;
          background-color: {_COLOR['bg']};
          padding: 40px 16px;
          -webkit-font-smoothing: antialiased;
        }}

        /* ── Outer wrapper ── */
        .wrapper {{
          max-width: 540px;
          margin: 0 auto;
        }}

        /* ── Card — dt-root feel ── */
        .card {{
          background: {_COLOR['card']};
          border-radius: 14px;
          border: 1px solid {_COLOR['card_border']};
          overflow: hidden;
          box-shadow:
            0 2px 6px {_COLOR['shadow']},
            0 8px 28px {_COLOR['shadow']},
            inset 0 1px 0 rgba(255,255,255,0.55);
        }}

        /* ── Header — dt-header-row gradient ── */
        .header {{
          background: linear-gradient(
            135deg,
            {_COLOR['header_from']} 0%,
            {_COLOR['header_to']} 100%
          );
          border-bottom: 2px solid {_COLOR['header_border']};
          padding: 32px 28px 26px;
          text-align: center;
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.12),
            0 3px 10px rgba(26,61,43,0.25);
          position: relative;
        }}

        /* Engraved horizontal rule inside header */
        .header::after {{
          content: '';
          display: block;
          margin: 18px auto 0;
          width: 60px;
          height: 2px;
          background: {_COLOR['accent_line']};
          border-radius: 2px;
          opacity: 0.6;
        }}

        .header-eyebrow {{
          font-family: 'Courier New', 'Courier', monospace;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: rgba(234,244,240,0.65);
          margin-bottom: 8px;
        }}

        .header-title {{
          font-size: 22px;
          font-weight: 700;
          color: {_COLOR['header_fg']};
          letter-spacing: 0.02em;
          line-height: 1.25;
        }}

        .header-sub {{
          font-size: 12px;
          color: rgba(234,244,240,0.70);
          margin-top: 6px;
          font-style: italic;
        }}

        /* ── Body ── */
        .body {{
          padding: 28px 28px 24px;
        }}

        /* ── Amount display — large primary teal ── */
        .amount-block {{
          text-align: center;
          margin-bottom: 24px;
          padding: 20px 0 18px;
          border-bottom: 1px solid {_COLOR['divider']};
        }}

        .amount-label {{
          font-family: 'Courier New', monospace;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: {_COLOR['label_fg']};
          margin-bottom: 6px;
        }}

        .amount-value {{
          font-size: 44px;
          font-weight: 900;
          color: {_COLOR['amount_fg']};
          letter-spacing: -0.02em;
          line-height: 1;
          font-family: 'Georgia', serif;
        }}

        /* ── Info table — dt-table feel ── */
        .info-table {{
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
          margin-bottom: 22px;
          border: 1px solid {_COLOR['divider']};
          border-radius: 10px;
          overflow: hidden;
        }}

        .info-table tr:nth-child(even) {{
          background: {_COLOR['row_even']};
        }}

        .info-table tr:nth-child(odd) {{
          background: {_COLOR['card']};
        }}

        .info-table td {{
          padding: 11px 14px;
          border-bottom: 1px solid {_COLOR['divider']};
          vertical-align: middle;
        }}

        .info-table tr:last-child td {{
          border-bottom: none;
        }}

        /* Left column — dt-header uppercase label style */
        .info-table td.col-label {{
          font-family: 'Courier New', monospace;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: {_COLOR['label_fg']};
          width: 42%;
        }}

        /* Right column — value */
        .info-table td.col-value {{
          font-size: 13px;
          font-weight: 700;
          color: {_COLOR['body_fg']};
          text-align: right;
        }}

        /* ── Badge — dt-badge parchment style ── */
        .badge {{
          display: inline-block;
          background: {_COLOR['badge_bg']};
          color: {_COLOR['badge_fg']};
          border-radius: 20px;
          padding: 3px 12px;
          font-size: 12px;
          font-weight: 700;
          font-family: 'Courier New', monospace;
          letter-spacing: 0.05em;
          border: 1px solid {_COLOR['card_border']};
        }}

        /* ── Notice paragraph ── */
        .notice {{
          font-size: 12.5px;
          color: {_COLOR['label_fg']};
          line-height: 1.65;
          border-left: 3px solid {_COLOR['accent_line']};
          padding-left: 12px;
          font-style: italic;
        }}

        /* ── Footer — dt-footer parchment ── */
        .footer {{
          background: {_COLOR['footer_bg']};
          border-top: 1px solid {_COLOR['divider']};
          padding: 16px 28px;
          text-align: center;
          font-size: 11px;
          color: {_COLOR['footer_fg']};
          font-family: 'Courier New', monospace;
          letter-spacing: 0.04em;
        }}

        .footer strong {{
          color: {_COLOR['header_from']};
        }}

        /* ── Responsive ── */
        @media (max-width: 560px) {{
          body {{ padding: 20px 8px; }}
          .header {{ padding: 24px 18px 20px; }}
          .body {{ padding: 20px 18px 18px; }}
          .amount-value {{ font-size: 36px; }}
          .footer {{ padding: 14px 18px; }}
        }}
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="card">

          <!-- Header -->
          <div class="header">
            <div class="header-eyebrow">Vaultly · Billing Alert</div>
            <div class="header-title">💳 Subscription Reminder</div>
            <div class="header-sub">Your upcoming billing notification</div>
          </div>

          <!-- Body -->
          <div class="body">

            <!-- Amount -->
            <div class="amount-block">
              <div class="amount-label">Amount Due</div>
              <div class="amount-value">{currency_symbol}{amount:,.2f}</div>
            </div>

            <!-- Info rows — dt-table banded style -->
            <table class="info-table">
              <tr>
                <td class="col-label">Subscription</td>
                <td class="col-value">{subscription_name}</td>
              </tr>
              <tr>
                <td class="col-label">Billing Day</td>
                <td class="col-value">Day {billing_day} of every month</td>
              </tr>
              <tr>
                <td class="col-label">Charges In</td>
                <td class="col-value">
                  <span class="badge">⏰ {days_before} day(s)</span>
                </td>
              </tr>
            </table>

            <!-- Notice -->
            <p class="notice">
              Ensure sufficient balance in your account before the billing date
              to avoid any interruption to your service.
            </p>

          </div><!-- /body -->

          <!-- Footer -->
          <div class="footer">
            Automated reminder from <strong>Vaultly</strong> &nbsp;·&nbsp;
            Manage notifications in your Subscriptions settings.
          </div>

        </div><!-- /card -->
      </div><!-- /wrapper -->
    </body>
    </html>
    """

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"]    = f"Vaultly <{GMAIL_USER}>"
        msg["To"]      = to_email
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(GMAIL_USER, GMAIL_PASS)
            server.sendmail(GMAIL_USER, to_email, msg.as_string())

        logger.info(f"✅ Reminder email sent to {to_email} for {subscription_name}")
        return True

    except Exception as e:
        logger.error(f"❌ Failed to send email to {to_email}: {e}", exc_info=True)
        return False