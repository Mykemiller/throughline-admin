"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/Toast";
import { Card, MicroLabel } from "@/components/ui";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  borderRadius: 8,
  border: "1px solid #D4CDBF",
  background: "#F2E6BC",
  fontSize: 13.5,
  color: "#1C1712",
};

export function AccountView({ email }: { email: string }) {
  const router = useRouter();
  const toast = useToast();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  async function changePassword() {
    if (!current || !next) {
      toast("Both keys are needed — the one you hold and the one you want.");
      return;
    }
    if (next !== confirm) {
      toast("The new keys don't match. Type them once more, slowly.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      if (res.ok) {
        setCurrent("");
        setNext("");
        setConfirm("");
        toast("The key is changed — the old one no longer turns.");
        return;
      }
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      toast(body.error ?? "Something went sideways on the path. Give it a moment — we'll find our way back.");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div style={{ maxWidth: 420 }}>
      <Card>
        <MicroLabel>Steward</MicroLabel>
        <div style={{ fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: 17, marginTop: 6 }}>{email}</div>
        <div style={{ fontSize: 12, color: "#6B4C2A", marginTop: 2 }}>role: steward · the only one authorized</div>
      </Card>

      <Card style={{ marginTop: 14 }}>
        <div style={{ fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: 17 }}>Change the key</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 14 }}>
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 500, color: "#7A736A", marginBottom: 4 }}>Current password</div>
            <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} style={inputStyle} autoComplete="current-password" data-testid="pw-current" />
          </div>
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 500, color: "#7A736A", marginBottom: 4 }}>New password</div>
            <input type="password" value={next} onChange={(e) => setNext(e.target.value)} style={inputStyle} autoComplete="new-password" data-testid="pw-new" />
          </div>
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 500, color: "#7A736A", marginBottom: 4 }}>New password, once more</div>
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} style={inputStyle} autoComplete="new-password" data-testid="pw-confirm" />
          </div>
        </div>
        <button
          onClick={changePassword}
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
          data-testid="pw-submit"
        >
          Change the key
        </button>
      </Card>

      <Card style={{ marginTop: 14 }}>
        <button
          onClick={signOut}
          className="hover:bg-[rgba(107,76,42,0.08)]"
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid #6B4C2A",
            cursor: "pointer",
            background: "transparent",
            color: "#6B4C2A",
            fontWeight: 600,
            fontSize: 13.5,
          }}
        >
          Step away — sign out
        </button>
      </Card>
    </div>
  );
}
