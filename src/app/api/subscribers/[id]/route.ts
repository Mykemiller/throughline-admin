import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import type { Companion, Plan, SubscriberStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const PLANS: Plan[] = ["founding", "family", "solo"];
const COMPANIONS: Companion[] = ["seth", "miriam"];
const STATUSES: SubscriberStatus[] = ["planned", "active", "invited", "suspended", "cancelled", "dead"];

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const sub = await prisma.subscriber.findUnique({
    where: { id },
    include: {
      familyMembers: { where: { source: "dialogue" }, orderBy: { addedAt: "asc" } },
      payments: { orderBy: { paidAt: "desc" }, take: 5 },
    },
  });
  if (!sub) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ subscriber: sub });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    plan?: string;
    companion?: string;
    status?: string;
    name?: string;
  };

  const existing = await prisma.subscriber.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data: Record<string, string> = {};
  if (body.plan) {
    if (!PLANS.includes(body.plan as Plan)) return NextResponse.json({ error: "Unknown plan" }, { status: 400 });
    data.plan = body.plan;
  }
  if (body.companion) {
    if (!COMPANIONS.includes(body.companion as Companion))
      return NextResponse.json({ error: "Unknown companion" }, { status: 400 });
    data.companion = body.companion;
  }
  if (body.status) {
    if (!STATUSES.includes(body.status as SubscriberStatus))
      return NextResponse.json({ error: "Unknown status" }, { status: 400 });
    data.status = body.status;
  }
  if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
  if (Object.keys(data).length === 0) return NextResponse.json({ error: "Nothing to change" }, { status: 400 });

  const updated = await prisma.subscriber.update({ where: { id }, data });

  let action: "suspend" | "reactivate" | "cancel" | "edit_profile" = "edit_profile";
  if (data.status === "suspended") action = "suspend";
  else if (data.status === "active" && existing.status === "suspended") action = "reactivate";
  else if (data.status === "cancelled") action = "cancel";
  await writeAudit({
    actorEmail: session.email,
    action,
    subscriberId: id,
    detail: { from: { plan: existing.plan, companion: existing.companion, status: existing.status }, to: data },
  });

  return NextResponse.json({ subscriber: updated });
}
