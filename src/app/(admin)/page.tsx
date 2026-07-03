import Link from "next/link";
import { PageFrame } from "@/components/PageFrame";
import { Card, CardTitle, SevPill, StatTile, Bar } from "@/components/ui";
import { serviceDot } from "@/lib/display";
import { fmtLogTime, fmtTime } from "@/lib/format";
import {
  getChaptersTotal,
  getLogs,
  getServices,
  getSourceTiles,
  getSubscriberRows,
  healthSummary,
} from "@/lib/queries";
import { syncSubscribersFromProduct } from "@/lib/bridge";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  await syncSubscribersFromProduct();
  const [tiles, services, logs, subs, CHAPTERS_TOTAL] = await Promise.all([
    getSourceTiles(),
    getServices(),
    getLogs({ take: 50 }),
    getSubscriberRows(),
    getChaptersTotal(),
  ]);
  const recentIssues = logs.filter((l) => l.severity !== "info").slice(0, 4);
  const topSubs = subs
    .filter((s) => s.status === "active")
    .sort((a, b) => b.minutes - a.minutes)
    .slice(0, 4);

  return (
    <PageFrame title="Overview" sub="quiet water — everything in view">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        {tiles.map((t) => (
          <StatTile key={t.label} {...t} />
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 14, marginTop: 14 }}>
        <Card>
          <CardTitle
            title="Service health"
            sub={healthSummary(services)}
            action={
              <Link
                href="/sources"
                style={{ fontSize: 12, fontWeight: 500, color: "#6B4C2A", textDecoration: "underline" }}
              >
                All sources →
              </Link>
            }
          />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 14 }}>
            {services.map((sv) => (
              <Link
                key={sv.id}
                href={`/sources?source=${encodeURIComponent(sv.name)}`}
                className="hover:border-[#C4873A]!"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "9px 10px",
                  borderRadius: 8,
                  background: "#F2E6BC",
                  border: "1px solid #D4CDBF",
                  textDecoration: "none",
                  color: "#1C1712",
                }}
              >
                <div style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, background: serviceDot(sv.status) }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {sv.name}
                  </div>
                  <div style={{ fontSize: 11, color: "#7A736A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {sv.status === "ok" ? "healthy" : sv.status}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Card>

        <Card>
          <CardTitle
            title="Needs attention"
            action={
              <Link
                href="/sources"
                style={{ fontSize: 12, fontWeight: 500, color: "#6B4C2A", textDecoration: "underline" }}
              >
                Full log →
              </Link>
            }
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
            {recentIssues.map((l) => (
              <div key={l.id} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ marginTop: 1 }}>
                  <SevPill sev={l.severity} small />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, lineHeight: 1.45 }}>{l.message}</div>
                  <div style={{ fontSize: 11, color: "#7A736A", marginTop: 2 }}>
                    {l.service.name} · {fmtLogTime(l.createdAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card style={{ marginTop: 14 }}>
        <CardTitle
          title="On the path this week"
          sub="most engaged subscribers"
          action={
            <Link
              href="/progress"
              style={{ fontSize: 12, fontWeight: 500, color: "#6B4C2A", textDecoration: "underline" }}
            >
              All progress →
            </Link>
          }
        />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 14 }}>
          {topSubs.map((s) => (
            <Link
              key={s.id}
              href={`/subscribers/${s.id}`}
              className="hover:border-[#C4873A]!"
              style={{
                background: "#F2E6BC",
                border: "1px solid #D4CDBF",
                borderRadius: 10,
                padding: 14,
                textDecoration: "none",
                color: "#1C1712",
                display: "block",
              }}
            >
              <div style={{ fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: 16 }}>{s.name}</div>
              <div style={{ fontSize: 11.5, color: "#7A736A", marginTop: 2 }}>
                with {s.companion === "seth" ? "Seth" : "Miriam"} · {fmtTime(s.minutes)}
              </div>
              <div style={{ marginTop: 12 }}>
                <Bar pct={Math.round((100 * s.chapters) / CHAPTERS_TOTAL)} color="#C4873A" />
              </div>
              <div style={{ fontSize: 11, color: "#6B4C2A", marginTop: 5 }}>
                Chapter {s.chapters} of {CHAPTERS_TOTAL} · {s.photos} photographs
              </div>
            </Link>
          ))}
        </div>
      </Card>
    </PageFrame>
  );
}
