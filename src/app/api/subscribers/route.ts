import { NextRequest, NextResponse } from "next/server";
import { getSubscriberRows } from "@/lib/queries";
import type { SubscriberStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("query")?.trim().toLowerCase() ?? "";
  const status = req.nextUrl.searchParams.get("status") ?? "";
  const rows = await getSubscriberRows();
  const filtered = rows.filter(
    (s) =>
      (!status || s.status === (status as SubscriberStatus)) &&
      (!query || s.name.toLowerCase().includes(query) || s.email.toLowerCase().includes(query))
  );
  return NextResponse.json({ subscribers: filtered });
}
