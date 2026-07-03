import { fmtHeaderDate } from "@/lib/format";

/** Header bar + scrollable content column shared by every section. */
export function PageFrame({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <>
      <div
        style={{
          padding: "22px 30px 14px",
          display: "flex",
          alignItems: "baseline",
          gap: 14,
          borderBottom: "1px solid #D4CDBF",
        }}
      >
        <div style={{ fontFamily: "var(--font-serif)", fontWeight: 700, fontSize: 25 }}>{title}</div>
        <div style={{ fontSize: 13, color: "#7A736A" }}>{sub}</div>
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 12, color: "#7A736A" }}>{fmtHeaderDate()}</div>
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: "22px 30px 48px" }}>{children}</div>
    </>
  );
}
