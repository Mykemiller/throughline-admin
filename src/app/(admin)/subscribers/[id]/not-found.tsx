import Link from "next/link";

export default function SubscriberNotFound() {
  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 30 }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontFamily: "var(--font-serif)", fontWeight: 700, fontSize: 20 }}>
          No one on the path by that name.
        </div>
        <Link
          href="/subscribers"
          style={{ display: "inline-block", marginTop: 12, fontSize: 13, fontWeight: 500, color: "#6B4C2A" }}
        >
          ← All subscribers
        </Link>
      </div>
    </div>
  );
}
