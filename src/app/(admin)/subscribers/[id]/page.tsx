import { notFound } from "next/navigation";
import { PageFrame } from "@/components/PageFrame";
import { prisma } from "@/lib/prisma";
import { fmtJoined, fmtLastActive, fmtShortDate, fmtTime } from "@/lib/format";
import { getChaptersTotal, getSubscriberProducts } from "@/lib/queries";
import { syncSubscribersFromProduct } from "@/lib/bridge";
import { DetailView } from "./DetailView";

export const dynamic = "force-dynamic";

export default async function SubscriberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await syncSubscribersFromProduct();
  const sub = await prisma.subscriber.findUnique({
    where: { id },
    include: {
      familyMembers: { where: { source: "dialogue" }, orderBy: { addedAt: "asc" } },
    },
  });
  if (!sub) notFound();

  const [subCount, minutes, photos, chapters, productRows, CHAPTERS_TOTAL] = await Promise.all([
    prisma.subscriber.count(),
    prisma.engagementSession.aggregate({ where: { subscriberId: id }, _sum: { durationMin: true } }),
    prisma.photo.count({ where: { subscriberId: id } }),
    prisma.chapterProgress.count({ where: { subscriberId: id } }),
    getSubscriberProducts(id),
    getChaptersTotal(),
  ]);
  const mins = minutes._sum.durationMin ?? 0;

  return (
    <PageFrame title="Subscribers" sub={`${subCount} on the path`}>
      <DetailView
        sub={{
          id: sub.id,
          name: sub.name,
          email: sub.email,
          plan: sub.plan,
          companion: sub.companion,
          status: sub.status,
          joined:
            sub.status === "invited" && sub.invitedAt
              ? `invited ${fmtShortDate(sub.invitedAt)}`
              : fmtJoined(sub.joinedAt),
          lastActive: fmtLastActive(sub.lastActiveAt),
          engagedLabel: fmtTime(mins),
          photos,
          chaptersLabel: `Chapter ${chapters} of ${CHAPTERS_TOTAL}`,
          chaptersPct: Math.round((100 * chapters) / CHAPTERS_TOTAL),
          people: sub.familyMembers.map((p) => ({
            name: p.name,
            relation: p.relation,
            via: p.addedVia,
            date: fmtShortDate(p.addedAt),
          })),
          productRows,
        }}
      />
    </PageFrame>
  );
}
