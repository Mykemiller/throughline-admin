import Link from "next/link";
import { PageFrame } from "@/components/PageFrame";
import { Card, CardTitle, SevPill, StatTile } from "@/components/ui";
import { serviceDot } from "@/lib/display";
import { fmtLogTime } from "@/lib/format";
import { getLogs, getServices, getSourceTiles, healthSummary } from "@/lib/queries";
import { SourceSelect } from "./SourceSelect";
import type { Severity } from "@prisma/client";

export const dynamic = "force-dynamic";

const SEV_CHIPS = [
  { v: "", label: "All" },
  { v: "error", label: "Errors" },
  { v: "warn", label: "Warnings" },
  { v: "info", label: "Info" },
] as const;

function filterHref(source: string, severity: string): string {
  const p = new URLSearchParams();
  if (source) p.set("source", source);
  if (severity) p.set("severity", severity);
  const qs = p.toString();
  return qs ? `/sources?${qs}` : "/sources";
}

export default async function SourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ source?: string; severity?: string }>;
}) {
  const sp = await searchParams;
  const source = sp.source ?? "";
  const severity = (["error", "warn", "info"] as const).includes(sp.severity as Severity)
    ? (sp.severity as Severity)
    : undefined;

  const [tiles, services, logs] = await Promise.all([
    getSourceTiles(),
    getServices(),
    getLogs({ source: source || undefined, severity, take: 50 }),
  ]);

  return (
    <PageFrame title="Sources & Logs" sub="ingestion, service health, and the error log">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        {tiles.map((t) => (
          <StatTile key={t.label} {...t} />
        ))}
      </div>

      <Card style={{ marginTop: 14 }}>
        <CardTitle title="Service health" sub={`${healthSummary(services)} · click a service to filter its log`} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginTop: 14 }}>
          {services.map((sv) => (
            <Link
              key={sv.id}
              href={filterHref(sv.name, severity ?? "")}
              className="hover:border-[#C4873A]!"
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                padding: 12,
                borderRadius: 10,
                background: "#F2E6BC",
                cursor: "pointer",
                border: `1px solid ${sv.status === "ok" ? "#D4CDBF" : "#C4873A"}`,
                textDecoration: "none",
                color: "#1C1712",
              }}
            >
              <div
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: "50%",
                  flexShrink: 0,
                  marginTop: 4,
                  background: serviceDot(sv.status),
                }}
              />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{sv.name}</div>
                <div style={{ fontSize: 12, color: "#7A736A", marginTop: 2, lineHeight: 1.4 }}>{sv.note}</div>
              </div>
            </Link>
          ))}
        </div>
      </Card>

      <Card style={{ marginTop: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: 17 }}>Error log</div>
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", gap: 6 }}>
            {SEV_CHIPS.map((c) => {
              const on = (severity ?? "") === c.v;
              return (
                <Link
                  key={c.label}
                  href={filterHref(source, c.v)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 99,
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: "pointer",
                    border: `1px solid ${on ? "#1E2A3A" : "#D4CDBF"}`,
                    background: on ? "#1E2A3A" : "transparent",
                    color: on ? "#F2E6BC" : "#6B4C2A",
                    textDecoration: "none",
                  }}
                >
                  {c.label}
                </Link>
              );
            })}
          </div>
          <SourceSelect
            value={source}
            severity={severity ?? ""}
            options={services.map((s) => s.name)}
          />
        </div>
        <div style={{ marginTop: 14, borderTop: "1px solid #D4CDBF" }}>
          {logs.map((lg) => (
            <div
              key={lg.id}
              style={{
                display: "grid",
                gridTemplateColumns: "64px 76px 150px 1fr",
                gap: 12,
                alignItems: "baseline",
                padding: "10px 4px",
                borderBottom: "1px solid rgba(212,205,191,0.55)",
                fontSize: 13,
              }}
            >
              <div style={{ fontSize: 12, color: "#7A736A" }}>{fmtLogTime(lg.createdAt)}</div>
              <div>
                <SevPill sev={lg.severity} />
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 500 }}>{lg.service.name}</div>
              <div style={{ lineHeight: 1.45 }}>{lg.message}</div>
            </div>
          ))}
          {logs.length === 0 ? (
            <div style={{ padding: "24px 4px", fontSize: 13, color: "#7A736A", fontStyle: "italic" }}>
              Nothing in the log for that filter. Quiet water.
            </div>
          ) : null}
        </div>
      </Card>
    </PageFrame>
  );
}
