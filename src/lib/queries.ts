import { prisma } from "@/lib/prisma";
import { fmtNumber, fmtTime } from "@/lib/format";
import { productLabel } from "@/lib/display";
import type { Product, Severity, ServiceStatus } from "@prisma/client";

export const CHAPTERS_TOTAL = 12;
const HEARTBEAT_STALE_MS = 15 * 60 * 1000;

export type SubscriberRow = Awaited<ReturnType<typeof getSubscriberRows>>[number];

/** One row per subscriber with the three canonical metrics + dialogue-people count. */
export async function getSubscriberRows() {
  const subs = await prisma.subscriber.findMany({ orderBy: { joinedAt: "asc" } });
  const [minutes, photos, chapters, people] = await Promise.all([
    prisma.engagementSession.groupBy({ by: ["subscriberId"], _sum: { durationMin: true } }),
    prisma.photo.groupBy({ by: ["subscriberId"], where: { subscriberId: { not: null } }, _count: true }),
    prisma.chapterProgress.groupBy({ by: ["subscriberId"], _count: true }),
    prisma.familyMember.groupBy({ by: ["subscriberId"], where: { source: "dialogue" }, _count: true }),
  ]);
  const byId = <T extends { subscriberId: string | null }>(rows: T[]) =>
    new Map(rows.map((r) => [r.subscriberId, r]));
  const mMin = byId(minutes);
  const mPhotos = byId(photos);
  const mCh = byId(chapters);
  const mPeople = byId(people);
  return subs.map((s) => ({
    ...s,
    minutes: mMin.get(s.id)?._sum.durationMin ?? 0,
    photos: mPhotos.get(s.id)?._count ?? 0,
    chapters: mCh.get(s.id)?._count ?? 0,
    peopleCount: mPeople.get(s.id)?._count ?? 0,
  }));
}

/** The four ingestion tiles shared by Overview and Sources & Logs. */
export async function getSourceTiles() {
  const [photosTotal, photosFromSubs, subs, familyTotal, familyDialogue, events] = await Promise.all([
    prisma.photo.count(),
    prisma.photo.count({ where: { source: "subscriber_upload" } }),
    prisma.subscriber.findMany({ select: { status: true } }),
    prisma.familyMember.count(),
    prisma.familyMember.count({ where: { source: "dialogue" } }),
    prisma.historicalEvent.count(),
  ]);
  const active = subs.filter((s) => s.status === "active").length;
  const invited = subs.filter((s) => s.status === "invited").length;
  return [
    { label: "Photos ingested", value: fmtNumber(photosTotal), note: `${photosFromSubs} from subscribers · rest from archives` },
    { label: "Subscribers", value: String(subs.length), note: `${active} active · ${invited} invited` },
    { label: "Family members ingested", value: String(familyTotal), note: `${familyDialogue} added through dialogue` },
    { label: "Historical events", value: String(events), note: "River coverage 1800–2026" },
  ];
}

/**
 * Services with effective status. A service that has reported a heartbeat before
 * but has gone quiet for 15+ minutes reads as degraded; services that have never
 * sent a heartbeat keep their registry status until they connect.
 */
const SERVICE_ORDER = [
  "Photo Ingestion",
  "Genealogy Feed",
  "Historical Archive",
  "AI Service Core (Narrator)",
  "Weaver",
  "Surfer",
  "Witness",
  "Reunion",
  "Scout",
];

export async function getServices() {
  const rows = await prisma.service.findMany();
  const services = [...rows].sort(
    (a, b) =>
      (SERVICE_ORDER.indexOf(a.name) + 1 || 99) - (SERVICE_ORDER.indexOf(b.name) + 1 || 99)
  );
  const now = Date.now();
  return services.map((s) => {
    let status: ServiceStatus = s.status;
    let note = s.note ?? "";
    if (s.status === "ok" && s.heartbeatAt && now - s.heartbeatAt.getTime() > HEARTBEAT_STALE_MS) {
      status = "degraded";
      const min = Math.round((now - s.heartbeatAt.getTime()) / 60000);
      note = `No heartbeat for ${min} min`;
    }
    return { id: s.id, name: s.name, status, note };
  });
}

export function healthSummary(services: { status: ServiceStatus }[]): string {
  const degraded = services.filter((s) => s.status !== "ok").length;
  return degraded
    ? `${degraded} of ${services.length} services degraded`
    : `all ${services.length} services healthy`;
}

export async function getLogs(opts: { source?: string; severity?: Severity; take?: number; cursor?: string }) {
  const logs = await prisma.logEvent.findMany({
    where: {
      ...(opts.severity ? { severity: opts.severity } : {}),
      ...(opts.source ? { service: { name: opts.source } } : {}),
    },
    include: { service: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: opts.take ?? 50,
    ...(opts.cursor ? { skip: 1, cursor: { id: opts.cursor } } : {}),
  });
  return logs;
}

/** Total minutes per product across all subscribers, sorted desc, with bar widths. */
export async function getProductAggregates() {
  const agg = await prisma.engagementSession.groupBy({ by: ["product"], _sum: { durationMin: true } });
  const rows = agg
    .map((a) => ({ product: a.product, minutes: a._sum.durationMin ?? 0 }))
    .sort((a, b) => b.minutes - a.minutes);
  const max = Math.max(1, ...rows.map((r) => r.minutes));
  return rows.map((r) => ({
    name: productLabel[r.product],
    label: fmtTime(r.minutes),
    pct: Math.round((100 * r.minutes) / max),
  }));
}

/** Per-product minutes for one subscriber, in canonical product order. */
export async function getSubscriberProducts(subscriberId: string) {
  const agg = await prisma.engagementSession.groupBy({
    by: ["product"],
    where: { subscriberId },
    _sum: { durationMin: true },
  });
  const order: Product[] = ["weaver", "surfer", "witness", "reunion", "scout", "narrator"];
  const byProduct = new Map(agg.map((a) => [a.product, a._sum.durationMin ?? 0]));
  const rows = order.map((p) => ({ product: p, minutes: byProduct.get(p) ?? 0 }));
  const max = Math.max(1, ...rows.map((r) => r.minutes));
  return rows.map((r) => ({
    name: productLabel[r.product],
    label: fmtTime(r.minutes),
    pct: Math.round((100 * r.minutes) / max),
  }));
}
