import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { getMailer } from "@/lib/mailer";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { name?: string; email?: string };
  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json({ error: "A name, at least — the letter needs someone to greet." }, { status: 400 });
  }
  const email = body.email?.trim() || `${name.toLowerCase().replace(/\s+/g, ".")}@example.com`;

  const existing = await prisma.subscriber.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Someone with that email is already on the path." }, { status: 409 });
  }

  const now = new Date();
  const sub = await prisma.subscriber.create({
    data: {
      name,
      email,
      plan: "solo",
      companion: "seth", // chosen properly when they arrive; freely editable
      status: "invited",
      joinedAt: now,
      invitedAt: now,
    },
  });

  await getMailer().send({
    to: email,
    subject: "An invitation to the path",
    text: `${name},\n\nA place on the Throughline path is being held for you. Your companion will be chosen when you arrive.\n\n— the stewards`,
  });
  await writeAudit({ actorEmail: session.email, action: "invite", subscriberId: sub.id, detail: { email } });

  return NextResponse.json({ subscriber: sub }, { status: 201 });
}
