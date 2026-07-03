import Link from "next/link";
import { PageFrame } from "@/components/PageFrame";
import { Bar, Card, CardTitle, StatTile, LabeledBar } from "@/components/ui";
import { fmtTime } from "@/lib/format";
import { getChaptersTotal, getProductAggregates, getSubscriberRows } from "@/lib/queries";
import { syncSubscribersFromProduct } from "@/lib/bridge";

export const dynamic = "force-dynamic";

const GRID = "1fr 1.6fr 0.8fr 1.6fr 0.9fr";

export default async function ProgressPage() {
  await syncSubscribersFromProduct();
  const [subs, productAgg, CHAPTERS_TOTAL] = await Promise.all([
    getSubscriberRows(),
    getProductAggregates(),
    getChaptersTotal(),
  ]);

  const totalPhotos = subs.reduce((a, s) => a + s.photos, 0);
  const totalChapters = subs.reduce((a, s) => a + s.chapters, 0);
  const engaged = subs.filter((s) => s.status === "active" || s.status === "suspended");
  const avgMin = Math.round(subs.reduce((a, s) => a + s.minutes, 0) / Math.max(1, engaged.length));
  const maxMin = Math.max(1, ...subs.map((s) => s.minutes));
  const rows = [...subs].sort((a, b) => b.minutes - a.minutes);

  const tiles = [
    { label: "Avg. time engaged", value: fmtTime(avgMin), note: "per active subscriber, all time" },
    { label: "Photographs attached", value: String(totalPhotos), note: "by subscribers, across the family" },
    {
      label: "Chapters completed",
      value: String(totalChapters),
      note: `of ${subs.length * CHAPTERS_TOTAL} possible across ${subs.length} subscribers`,
    },
  ];

  return (
    <PageFrame title="Progress" sub="time, photographs, chapters">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        {tiles.map((t) => (
          <StatTile key={t.label} {...t} />
        ))}
      </div>

      <div style={{ background: "#EDE4D0", border: "1px solid #D4CDBF", borderRadius: 12, marginTop: 14, overflow: "hidden" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: GRID,
            gap: 14,
            padding: "11px 18px",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.07em",
            textTransform: "uppercase",
            color: "#7A736A",
            borderBottom: "1px solid #D4CDBF",
          }}
        >
          <div>Subscriber</div>
          <div>Time engaged</div>
          <div>Photographs</div>
          <div>Chapters</div>
          <div>People added</div>
        </div>
        {rows.map((s) => (
          <Link
            key={s.id}
            href={`/subscribers/${s.id}`}
            className="hover:bg-[#F2E6BC]"
            style={{
              display: "grid",
              gridTemplateColumns: GRID,
              gap: 14,
              alignItems: "center",
              padding: "13px 18px",
              fontSize: 13.5,
              cursor: "pointer",
              borderBottom: "1px solid rgba(212,205,191,0.55)",
              textDecoration: "none",
              color: "#1C1712",
            }}
          >
            <div style={{ fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: 15 }}>{s.name}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <Bar pct={Math.round((100 * s.minutes) / maxMin)} color="#4A7C59" height={6} />
              </div>
              <span style={{ fontSize: 12.5, color: "#6B4C2A", width: 58 }}>{fmtTime(s.minutes)}</span>
            </div>
            <div>{s.photos}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <Bar pct={Math.round((100 * s.chapters) / CHAPTERS_TOTAL)} color="#C4873A" height={6} />
              </div>
              <span style={{ fontSize: 12.5, color: "#6B4C2A", width: 44 }}>
                {s.chapters}/{CHAPTERS_TOTAL}
              </span>
            </div>
            <div>{s.peopleCount}</div>
          </Link>
        ))}
      </div>

      <Card style={{ marginTop: 14 }}>
        <CardTitle title="Engagement by product" sub="all subscribers, total time" />
        <div style={{ display: "flex", flexDirection: "column", gap: 11, marginTop: 14, maxWidth: 560 }}>
          {productAgg.map((pr) => (
            <LabeledBar key={pr.name} name={pr.name} label={pr.label} pct={pr.pct} color="#5B8FA8" height={6} />
          ))}
        </div>
      </Card>
    </PageFrame>
  );
}
