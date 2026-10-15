import { NextResponse } from "next/server";

const BACKEND =
  (process.env.PORTFOLIO_API_URL ?? process.env.NEXT_PUBLIC_PORTFOLIO_API_URL ?? "").replace(/\/$/, "");

export const dynamic = "force-dynamic";

export async function GET() {
  if (!BACKEND) {
    return NextResponse.json({ ok: false, error: "PORTFOLIO_API_URL not configured" }, { status: 503 });
  }
  try {
    const res = await fetch(`${BACKEND}/health`, { cache: "no-store" });
    const body = await res.text();
    return new NextResponse(body, {
      status: res.status,
      headers: { "content-type": res.headers.get("content-type") ?? "application/json" },
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 502 });
  }
}
