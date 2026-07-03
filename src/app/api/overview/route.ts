import { NextResponse } from "next/server";
import { getLogs, getServices, getSourceTiles, getSubscriberRows, healthSummary } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  const [tiles, services, logs, subs] = await Promise.all([
    getSourceTiles(),
    getServices(),
    getLogs({ take: 50 }),
    getSubscriberRows(),
  ]);
  return NextResponse.json({
    tiles,
    services,
    healthSummary: healthSummary(services),
    needsAttention: logs
      .filter((l) => l.severity !== "info")
      .slice(0, 4)
      .map((l) => ({ id: l.id, severity: l.severity, message: l.message, source: l.service.name, at: l.createdAt })),
    topEngaged: subs
      .filter((s) => s.status === "active")
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 4)
      .map((s) => ({ id: s.id, name: s.name, companion: s.companion, minutes: s.minutes, chapters: s.chapters, photos: s.photos })),
  });
}
