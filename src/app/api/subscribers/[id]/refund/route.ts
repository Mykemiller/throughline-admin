import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { getPaymentProvider } from "@/lib/payments";

export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const payment = await prisma.payment.findFirst({
    where: { subscriberId: id, refundedAt: null },
    orderBy: { paidAt: "desc" },
  });
  if (!payment) return NextResponse.json({ error: "No payment to refund" }, { status: 404 });

  const result = await getPaymentProvider().refund({ paymentId: payment.id, amountCents: payment.amountCents });
  if (!result.ok) return NextResponse.json({ error: "Refund failed at the provider" }, { status: 502 });

  const updated = await prisma.payment.update({
    where: { id: payment.id },
    data: { refundedAt: new Date() },
  });
  await writeAudit({
    actorEmail: session.email,
    action: "refund",
    subscriberId: id,
    detail: { paymentId: payment.id, amountCents: payment.amountCents, providerRef: result.providerRef ?? null },
  });

  return NextResponse.json({ payment: updated });
}
