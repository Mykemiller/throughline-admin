import { sevPill, statusPill } from "@/lib/display";
import type { Severity, SubscriberStatus } from "@prisma/client";

export function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: "#EDE4D0", border: "1px solid #D4CDBF", borderRadius: 12, padding: 18, ...style }}>
      {children}
    </div>
  );
}

export function MicroLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "#7A736A",
      }}
    >
      {children}
    </div>
  );
}

export function StatTile({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div style={{ background: "#EDE4D0", border: "1px solid #D4CDBF", borderRadius: 12, padding: "18px 18px 16px" }}>
      <MicroLabel>{label}</MicroLabel>
      <div style={{ fontFamily: "var(--font-serif)", fontWeight: 700, fontSize: 34, marginTop: 6 }}>{value}</div>
      <div style={{ fontSize: 12, color: "#6B4C2A", marginTop: 4 }}>{note}</div>
    </div>
  );
}

export function CardTitle({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
      <div style={{ fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: 17 }}>{title}</div>
      {sub ? <div style={{ fontSize: 12, color: "#7A736A" }}>{sub}</div> : null}
      <div style={{ flex: 1 }} />
      {action}
    </div>
  );
}

export function StatusPill({ status }: { status: SubscriberStatus }) {
  const p = statusPill[status];
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        padding: "3px 10px",
        borderRadius: 99,
        background: p.bg,
        color: p.color,
      }}
    >
      {p.label}
    </span>
  );
}

export function SevPill({ sev, small }: { sev: Severity; small?: boolean }) {
  const p = sevPill[sev];
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.06em",
        padding: small ? "2px 7px" : "2px 8px",
        borderRadius: 99,
        background: p.bg,
        color: p.color,
      }}
    >
      {sev.toUpperCase()}
    </span>
  );
}

export function Bar({ pct, color, height = 5 }: { pct: number; color: string; height?: number }) {
  return (
    <div style={{ height, borderRadius: 3, background: "#D4CDBF", overflow: "hidden" }}>
      <div style={{ height: "100%", borderRadius: 3, background: color, width: `${Math.min(100, pct)}%` }} />
    </div>
  );
}

export function LabeledBar({ name, label, pct, color, height = 5 }: { name: string; label: string; pct: number; color: string; height?: number }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 4 }}>
        <span style={{ fontWeight: 500 }}>{name}</span>
        <span style={{ color: "#7A736A" }}>{label}</span>
      </div>
      <Bar pct={pct} color={color} height={height} />
    </div>
  );
}
