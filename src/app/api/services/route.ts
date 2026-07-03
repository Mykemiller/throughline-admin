import { NextResponse } from "next/server";
import { getServices, healthSummary } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  const services = await getServices();
  return NextResponse.json({ services, healthSummary: healthSummary(services) });
}
