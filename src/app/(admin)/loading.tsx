export default function Loading() {
  return (
    <>
      <div style={{ padding: "22px 30px 14px", borderBottom: "1px solid #D4CDBF" }}>
        <div className="skeleton" style={{ width: 220, height: 30, borderRadius: 8 }} />
      </div>
      <div style={{ flex: 1, overflow: "hidden", padding: "22px 30px 48px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: 108 }} />
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 14, marginTop: 14 }}>
          <div className="skeleton" style={{ height: 220 }} />
          <div className="skeleton" style={{ height: 220 }} />
        </div>
        <div className="skeleton" style={{ height: 190, marginTop: 14 }} />
      </div>
    </>
  );
}
