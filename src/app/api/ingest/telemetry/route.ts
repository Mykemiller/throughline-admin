import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serviceForToken } from "@/lib/service-tokens";
import type { Product, Severity } from "@prisma/client";

export const dynamic = "force-dynamic";

const PRODUCTS: Product[] = ["weaver", "surfer", "witness", "reunion", "scout", "narrator"];
const SEVERITIES: Severity[] = ["error", "warn", "info"];

type TelemetryEvent =
  | { type: "heartbeat"; status?: "ok" | "degraded" | "down"; note?: string }
  | { type: "log"; severity: Severity; message: string; meta?: Record<string, unknown> }
  | {
      type: "session";
      subscriberEmail: string;
      product: Product;
      startedAt: string;
      endedAt?: string;
      durationMin: number;
    }
  | { type: "photo"; subscriberEmail?: string; storageKey: string; source?: string; exifTakenAt?: string; checksumOk?: boolean }
  | { type: "family_member"; subscriberEmail: string; name: string; relation: string; addedVia?: string; source?: string }
  | { type: "historical_event"; title: string; year: number; era: string; sourceRef?: string };

/**
 * The one door every upstream reports through: the five products, the Narrator,
 * and the three pipelines. Authenticated by per-service bearer token (SERVICE_TOKENS).
 */
export async function POST(req: NextRequest) {
  const serviceName = serviceForToken(req.headers.get("authorization"));
  if (!serviceName) return NextResponse.json({ error: "Unknown service token" }, { status: 401 });

  const service = await prisma.service.findUnique({ where: { name: serviceName } });
  if (!service) return NextResponse.json({ error: "Service not registered" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { events?: TelemetryEvent[] } | null;
  const events = body?.events;
  if (!Array.isArray(events) || events.length === 0) {
    return NextResponse.json({ error: "Body must be { events: [...] }" }, { status: 400 });
  }
  if (events.length > 500) {
    return NextResponse.json({ error: "At most 500 events per batch" }, { status: 400 });
  }

  const results: { accepted: number; rejected: { index: number; reason: string }[] } = {
    accepted: 0,
    rejected: [],
  };

  for (let i = 0; i < events.length; i++) {
    const ev = events[i];
    try {
      switch (ev.type) {
        case "heartbeat": {
          await prisma.service.update({
            where: { id: service.id },
            data: {
              heartbeatAt: new Date(),
              ...(ev.status ? { status: ev.status } : {}),
              ...(ev.note !== undefined ? { note: ev.note } : {}),
            },
          });
          break;
        }
        case "log": {
          if (!SEVERITIES.includes(ev.severity)) throw new Error("bad severity");
          if (!ev.message) throw new Error("missing message");
          await prisma.logEvent.create({
            data: {
              serviceId: service.id,
              severity: ev.severity,
              message: ev.message,
              meta: ev.meta ? JSON.parse(JSON.stringify(ev.meta)) : undefined,
            },
          });
          break;
        }
        case "session": {
          if (!PRODUCTS.includes(ev.product)) throw new Error("bad product");
          const sub = await prisma.subscriber.findUnique({ where: { email: ev.subscriberEmail } });
          if (!sub) throw new Error("unknown subscriber");
          const startedAt = new Date(ev.startedAt);
          if (Number.isNaN(startedAt.getTime())) throw new Error("bad startedAt");
          if (!Number.isInteger(ev.durationMin) || ev.durationMin < 0) throw new Error("bad durationMin");
          await prisma.$transaction([
            prisma.engagementSession.create({
              data: {
                subscriberId: sub.id,
                product: ev.product,
                startedAt,
                endedAt: ev.endedAt ? new Date(ev.endedAt) : null,
                durationMin: ev.durationMin,
              },
            }),
            prisma.subscriber.update({
              where: { id: sub.id },
              data: { lastActiveAt: ev.endedAt ? new Date(ev.endedAt) : startedAt },
            }),
          ]);
          break;
        }
        case "photo": {
          if (!ev.storageKey) throw new Error("missing storageKey");
          const sub = ev.subscriberEmail
            ? await prisma.subscriber.findUnique({ where: { email: ev.subscriberEmail } })
            : null;
          await prisma.photo.create({
            data: {
              subscriberId: sub?.id,
              storageKey: ev.storageKey,
              source: ev.source ?? (sub ? "subscriber_upload" : "archive_import"),
              exifTakenAt: ev.exifTakenAt ? new Date(ev.exifTakenAt) : null,
              eraEstimated: !ev.exifTakenAt,
              checksumOk: ev.checksumOk ?? true,
            },
          });
          break;
        }
        case "family_member": {
          const sub = await prisma.subscriber.findUnique({ where: { email: ev.subscriberEmail } });
          if (!sub) throw new Error("unknown subscriber");
          if (!ev.name || !ev.relation) throw new Error("missing name/relation");
          await prisma.familyMember.create({
            data: {
              subscriberId: sub.id,
              name: ev.name,
              relation: ev.relation,
              addedVia: ev.addedVia ?? "dialogue",
              source: ev.source ?? "dialogue",
            },
          });
          break;
        }
        case "historical_event": {
          if (!ev.title || !Number.isInteger(ev.year)) throw new Error("missing title/year");
          await prisma.historicalEvent.upsert({
            where: { dedupeKey: `${ev.title}::${ev.year}` },
            create: {
              title: ev.title,
              year: ev.year,
              era: ev.era,
              sourceRef: ev.sourceRef,
              dedupeKey: `${ev.title}::${ev.year}`,
            },
            update: {},
          });
          break;
        }
        default:
          throw new Error("unknown event type");
      }
      results.accepted++;
    } catch (e) {
      results.rejected.push({ index: i, reason: e instanceof Error ? e.message : "failed" });
    }
  }

  return NextResponse.json(results, { status: results.rejected.length ? 207 : 200 });
}
