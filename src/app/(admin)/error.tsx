"use client";

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 30 }}>
      <div
        style={{
          background: "#EDE4D0",
          border: "1px solid #D4CDBF",
          borderRadius: 12,
          padding: "26px 30px",
          maxWidth: 460,
          textAlign: "center",
        }}
      >
        <div style={{ fontFamily: "var(--font-serif)", fontWeight: 700, fontSize: 20 }}>
          Something went sideways on the path.
        </div>
        <div style={{ fontSize: 13.5, color: "#7A736A", marginTop: 8, lineHeight: 1.5 }}>
          Give it a moment — we&apos;ll find our way back.
        </div>
        <button
          onClick={reset}
          className="hover:bg-[#B37A31]!"
          style={{
            marginTop: 18,
            padding: "9px 18px",
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
            background: "#C4873A",
            color: "#1C1712",
            fontWeight: 600,
            fontSize: 13.5,
          }}
        >
          Try again
        </button>
      </div>
    </div>
  );
}
