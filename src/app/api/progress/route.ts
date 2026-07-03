import { NextResponse } from "next/server";
import { getProductAggregates, getSubscriberRows } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  const [subs, products] = await Promise.all([getSubscriberRows(), getProductAggregates()]);
  return NextResponse.json({
    subscribers: [...subs]
      .sort((a, b) => b.minutes - a.minutes)
      .map((s) => ({
        id: s.id,
        name: s.name,
        minutes: s.minutes,
        photos: s.photos,
        chapters: s.chapters,
        peopleAdded: s.peopleCount,
      })),
    products,
  });
}
