import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, createSessionToken, isAllowed, verifyLoginToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") ?? "";
  const email = await verifyLoginToken(token);
  const dest = req.nextUrl.clone();
  dest.search = "";
  if (!email || !isAllowed(email)) {
    dest.pathname = "/login";
    dest.search = "?expired=1";
    return NextResponse.redirect(dest);
  }
  dest.pathname = "/";
  const res = NextResponse.redirect(dest);
  res.cookies.set(SESSION_COOKIE, await createSessionToken(email), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });
  return res;
}
