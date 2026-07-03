import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createImpersonationToken, getSession } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const sub = await prisma.subscriber.findUnique({ where: { id } });
  if (!sub) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const token = await createImpersonationToken(id, session.email);
  await writeAudit({
    actorEmail: session.email,
    action: "impersonate",
    subscriberId: id,
    detail: { readOnly: true, expiresInMin: 15 },
  });

  return NextResponse.json({
    token,
    readOnly: true,
    expiresInMin: 15,
    note: "Present this bearer token to the subscriber-facing app.",
  });
}
