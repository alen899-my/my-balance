import { NextResponse } from "next/server";

export const revalidate = 300; // Cache for 5 minutes (300 seconds)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const currency = searchParams.get("currency") || "USD";

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

  try {
    const res = await fetch(`${API_BASE_URL}/metals/live-prices?currency=${currency}`, {
      next: { revalidate: 300 } 
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch prices" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
