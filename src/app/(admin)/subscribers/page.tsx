import { PageFrame } from "@/components/PageFrame";
import { companionLabel, planLabel } from "@/lib/display";
import { fmtLastActive, fmtShortDate } from "@/lib/format";
import { CHAPTERS_TOTAL, getSubscriberRows } from "@/lib/queries";
import { SubscribersView, type SubscriberListItem } from "./SubscribersView";

export const dynamic = "force-dynamic";

export default async function SubscribersPage() {
  const rows = await getSubscriberRows();
  const items: SubscriberListItem[] = rows.map((s) => ({
    id: s.id,
    name: s.name,
    email: s.email,
    plan: planLabel[s.plan],
    companion: companionLabel[s.companion],
    status: s.status,
    photos: s.photos,
    chapters: s.chapters,
    chaptersPct: Math.round((100 * s.chapters) / CHAPTERS_TOTAL),
    chaptersShort: `${s.chapters}/${CHAPTERS_TOTAL}`,
    lastActive:
      s.status === "invited" && !s.lastActiveAt
        ? "—"
        : fmtLastActive(s.lastActiveAt),
    invitedLabel: s.status === "invited" && s.invitedAt ? `invited ${fmtShortDate(s.invitedAt)}` : null,
  }));

  return (
    <PageFrame title="Subscribers" sub={`${rows.length} on the path`}>
      <SubscribersView items={items} />
    </PageFrame>
  );
}
