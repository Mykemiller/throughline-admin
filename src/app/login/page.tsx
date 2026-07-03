"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 13px",
  borderRadius: 8,
  border: "1px solid #D4CDBF",
  background: "#EDE4D0",
  fontSize: 13.5,
  color: "#1C1712",
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function signIn() {
    if (!email.trim() || !password) {
      setNote("An email and a key, both — the gate needs each.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      if (res.ok) {
        router.push("/");
        router.refresh();
        return;
      }
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setNote(body.error ?? "That key doesn't fit this gate.");
    } finally {
      setBusy(false);
    }
  }

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
          The steward&apos;s gate.
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 20 }}>
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 500, color: "#7A736A", marginBottom: 4 }}>Email</div>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="steward@example.com"
              style={inputStyle}
              data-testid="login-email"
              autoComplete="username"
            />
          </div>
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 500, color: "#7A736A", marginBottom: 4 }}>Password</div>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="your key"
              style={inputStyle}
              data-testid="login-password"
              autoComplete="current-password"
              onKeyDown={(e) => e.key === "Enter" && signIn()}
            />
          </div>
        </div>

        <button
          onClick={signIn}
          disabled={busy}
          className="hover:bg-[#B37A31]!"
          style={{
            marginTop: 16,
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
          data-testid="login-submit"
        >
          Open the gate
        </button>

        {note ? (
          <div style={{ fontSize: 12.5, color: "#6B4C2A", marginTop: 14, fontStyle: "italic", lineHeight: 1.5 }}>
            {note}
          </div>
        ) : null}
      </div>
    </div>
  );
}
