"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [key, setKey] = useState("");
  const [note, setNote] = useState(params.get("expired") ? "That letter has faded. Ask for another." : "");
  const [busy, setBusy] = useState(false);

  async function requestLink() {
    if (!email.trim()) {
      setNote("An email, at least — the letter needs somewhere to go.");
      return;
    }
    setBusy(true);
    try {
      await fetch("/api/auth/request-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      setNote("If that address belongs to a steward, a letter is on its way.");
    } finally {
      setBusy(false);
    }
  }

  async function useKey() {
    if (!key.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/auth/key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: key.trim(), email: email.trim() || undefined }),
      });
      if (res.ok) {
        router.push("/");
        router.refresh();
        return;
      }
      setNote("That key doesn't fit this gate.");
    } finally {
      setBusy(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 13px",
    borderRadius: 8,
    border: "1px solid #D4CDBF",
    background: "#EDE4D0",
    fontSize: 13.5,
    color: "#1C1712",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-sans)",
        color: "#1C1712",
        background:
          "radial-gradient(ellipse 900px 500px at 85% -10%, rgba(74,124,89,0.10), rgba(74,124,89,0) 70%), radial-gradient(ellipse 800px 600px at -10% 110%, rgba(196,135,58,0.08), rgba(196,135,58,0) 65%), linear-gradient(165deg, #F2E6BC 0%, #EFE3B6 60%, #EADEAC 100%)",
      }}
    >
      <div
        style={{
          width: 420,
          background: "#EDE4D0",
          border: "1px solid #D4CDBF",
          borderRadius: 14,
          padding: 30,
          boxShadow: "0 20px 60px rgba(28,23,18,0.15)",
        }}
      >
        <div style={{ fontFamily: "var(--font-serif)", fontWeight: 700, fontSize: 24, letterSpacing: "0.02em" }}>
          Throughline
        </div>
        <div style={{ fontFamily: "var(--font-serif)", fontSize: 13, color: "#C4873A", marginTop: 2, letterSpacing: "0.06em" }}>
          Administrator
        </div>
        <div style={{ fontSize: 13, color: "#7A736A", marginTop: 14, lineHeight: 1.5 }}>
          The steward&apos;s gate. Ask for a letter, or turn your key.
        </div>

        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 11.5, fontWeight: 500, color: "#7A736A", marginBottom: 4 }}>Email</div>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="steward@example.com"
            style={inputStyle}
            data-testid="login-email"
          />
          <button
            onClick={requestLink}
            disabled={busy}
            className="hover:bg-[#B37A31]!"
            style={{
              marginTop: 10,
              width: "100%",
              padding: "10px 12px",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              background: "#C4873A",
              color: "#1C1712",
              fontWeight: 600,
              fontSize: 13.5,
              opacity: busy ? 0.7 : 1,
            }}
          >
            Send me a letter
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "18px 0" }}>
          <div style={{ flex: 1, height: 1, background: "#D4CDBF" }} />
          <div style={{ fontSize: 11, color: "#7A736A", letterSpacing: "0.06em" }}>OR</div>
          <div style={{ flex: 1, height: 1, background: "#D4CDBF" }} />
        </div>

        <div>
          <div style={{ fontSize: 11.5, fontWeight: 500, color: "#7A736A", marginBottom: 4 }}>Steward key</div>
          <input
            value={key}
            onChange={(e) => setKey(e.target.value)}
            type="password"
            placeholder="the key you were handed"
            style={inputStyle}
            data-testid="login-key"
            onKeyDown={(e) => e.key === "Enter" && useKey()}
          />
          <button
            onClick={useKey}
            disabled={busy}
            className="hover:bg-[rgba(107,76,42,0.08)]"
            style={{
              marginTop: 10,
              width: "100%",
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid #6B4C2A",
              cursor: "pointer",
              background: "transparent",
              color: "#6B4C2A",
              fontWeight: 600,
              fontSize: 13.5,
              opacity: busy ? 0.7 : 1,
            }}
            data-testid="login-key-submit"
          >
            Open the gate
          </button>
        </div>

        {note ? (
          <div style={{ fontSize: 12.5, color: "#6B4C2A", marginTop: 14, fontStyle: "italic", lineHeight: 1.5 }}>
            {note}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}
