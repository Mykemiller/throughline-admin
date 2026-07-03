import { NextRequest, NextResponse } from "next/server";
import { createLoginToken, isAllowed } from "@/lib/auth";
import { getMailer } from "@/lib/mailer";

export async function POST(req: NextRequest) {
  const { email } = (await req.json().catch(() => ({}))) as { email?: string };
  // Always return 200 so the form can't be used to probe the allowlist.
  if (!email || !isAllowed(email)) {
    return NextResponse.json({ ok: true });
  }
  const token = await createLoginToken(email);
  const base = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
  const link = `${base}/api/auth/callback?token=${encodeURIComponent(token)}`;
  await getMailer().send({
    to: email,
    subject: "A letter from the Throughline steward's gate",
    text: `Your way in, good for 15 minutes:\n\n${link}\n\nIf you didn't ask for this, let the water carry it away.`,
  });
  return NextResponse.json({ ok: true });
}
