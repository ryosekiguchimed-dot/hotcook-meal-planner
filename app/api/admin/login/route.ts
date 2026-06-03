import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { password } = (await request.json().catch(() => ({}))) as { password?: string };
  const adminPassword = process.env.ADMIN_PASSWORD ?? "hotcook";

  return NextResponse.json({ ok: password === adminPassword });
}
