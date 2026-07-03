import { NextRequest, NextResponse } from "next/server";
import { getLogs } from "@/lib/queries";
import type { Severity } from "@prisma/client";

export const dynamic = "force-dynamic";

const PAGE = 50;

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const source = p.get("source") ?? undefined;
  const sevRaw = p.get("severity") ?? "";
  const severity = (["error", "warn", "info"] as const).includes(sevRaw as Severity)
    ? (sevRaw as Severity)
    : undefined;
  const cursor = p.get("cursor") ?? undefined;

  const logs = await getLogs({ source, severity, cursor, take: PAGE + 1 });
  const hasMore = logs.length > PAGE;
  const page = hasMore ? logs.slice(0, PAGE) : logs;
  return NextResponse.json({
    logs: page.map((l) => ({
      id: l.id,
      severity: l.severity,
      source: l.service.name,
      message: l.message,
      meta: l.meta,
      createdAt: l.createdAt,
    })),
    nextCursor: hasMore ? page[page.length - 1].id : null,
  });
}
