import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, allowedEmails, createSessionToken, isAllowed } from "@/lib/auth";

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function POST(req: NextRequest) {
  const { key, email } = (await req.json().catch(() => ({}))) as { key?: string; email?: string };
  const expected = process.env.ADMIN_ACCESS_KEY;
  if (!expected || !key || !timingSafeEqual(key, expected)) {
    return NextResponse.json({ error: "That key doesn't fit this gate." }, { status: 401 });
  }
  const sessionEmail = email && isAllowed(email) ? email : allowedEmails()[0];
  if (!sessionEmail) {
    return NextResponse.json({ error: "No stewards on the allowlist." }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, await createSessionToken(sessionEmail), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });
  return res;
}
