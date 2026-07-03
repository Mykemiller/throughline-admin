"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/Toast";
import { Bar, StatusPill } from "@/components/ui";
import type { SubscriberStatus } from "@prisma/client";

export type SubscriberListItem = {
  id: string;
  name: string;
  email: string;
  plan: string;
  companion: string;
  status: SubscriberStatus;
  photos: number;
  chapters: number;
  chaptersPct: number;
  chaptersShort: string;
  lastActive: string;
  invitedLabel: string | null;
};

const CHIPS = [
  { v: "all", label: "All" },
  { v: "planned", label: "Planned" },
  { v: "active", label: "Active" },
  { v: "invited", label: "Invited" },
  { v: "suspended", label: "Suspended" },
  { v: "cancelled", label: "Cancelled" },
  { v: "dead", label: "Dead" },
] as const;

const GRID = "1.1fr 1.7fr 0.8fr 0.9fr 0.9fr 0.7fr 0.9fr 0.9fr";

export function SubscribersView({ items }: { items: SubscriberListItem[] }) {
  const router = useRouter();
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showInvite, setShowInvite] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [sending, setSending] = useState(false);

  const q = query.trim().toLowerCase();
  const filtered = items.filter(
    (s) =>
      (statusFilter === "all" || s.status === statusFilter) &&
      (!q || s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q))
  );

  async function sendInvite() {
    const name = inviteName.trim();
    if (!name) {
      toast("A name, at least — the letter needs someone to greet.");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email: inviteEmail.trim() }),
      });
      if (!res.ok) throw new Error(await res.text());
      setShowInvite(false);
      toast(`Invitation sent to ${name} — the path is ready when they are`);
      router.refresh();
    } catch {
      toast("Something went sideways on the path. Give it a moment — we'll find our way back.");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or email…"
          style={{
            width: 280,
            padding: "9px 13px",
            borderRadius: 8,
            border: "1px solid #D4CDBF",
            background: "#EDE4D0",
            fontSize: 13.5,
            color: "#1C1712",
          }}
        />
        <div style={{ display: "flex", gap: 6 }}>
          {CHIPS.map((c) => {
            const on = statusFilter === c.v;
            return (
              <div
                key={c.v}
                onClick={() => setStatusFilter(c.v)}
                style={{
                  padding: "7px 13px",
                  borderRadius: 99,
                  fontSize: 12.5,
                  fontWeight: 500,
                  cursor: "pointer",
                  border: `1px solid ${on ? "#1E2A3A" : "#D4CDBF"}`,
                  background: on ? "#1E2A3A" : "transparent",
                  color: on ? "#F2E6BC" : "#6B4C2A",
                }}
              >
                {c.label}
              </div>
            );
          })}
        </div>
        <div style={{ flex: 1 }} />
        <button
          onClick={() => {
            setInviteName("");
            setInviteEmail("");
            setShowInvite(true);
          }}
          className="hover:bg-[#B37A31]!"
          style={{
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
          + Invite a subscriber
        </button>
      </div>

      <div style={{ background: "#EDE4D0", border: "1px solid #D4CDBF", borderRadius: 12, marginTop: 14, overflow: "hidden" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: GRID,
            gap: 10,
            padding: "11px 18px",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.07em",
            textTransform: "uppercase",
            color: "#7A736A",
            borderBottom: "1px solid #D4CDBF",
          }}
        >
          <div>Subscriber</div>
          <div>Email</div>
          <div>Plan</div>
          <div>Companion</div>
          <div>Status</div>
          <div>Photos</div>
          <div>Chapters</div>
          <div>Last active</div>
        </div>
        {filtered.map((s) => (
          <div
            key={s.id}
            onClick={() => router.push(`/subscribers/${s.id}`)}
            className="hover:bg-[#F2E6BC]"
            style={{
              display: "grid",
              gridTemplateColumns: GRID,
              gap: 10,
              alignItems: "center",
              padding: "12px 18px",
              fontSize: 13.5,
              cursor: "pointer",
              borderBottom: "1px solid rgba(212,205,191,0.55)",
            }}
          >
            <div style={{ fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: 15 }}>{s.name}</div>
            <div style={{ color: "#7A736A", fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {s.email}
            </div>
            <div>{s.plan}</div>
            <div>{s.companion}</div>
            <div>
              <StatusPill status={s.status} />
            </div>
            <div>{s.photos}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ flex: 1, maxWidth: 52 }}>
                <Bar pct={s.chaptersPct} color="#C4873A" />
              </div>
              <span style={{ fontSize: 12, color: "#6B4C2A" }}>{s.chaptersShort}</span>
            </div>
            <div style={{ fontSize: 12.5, color: "#7A736A" }}>{s.lastActive}</div>
          </div>
        ))}
        {filtered.length === 0 ? (
          <div style={{ padding: 28, fontSize: 13.5, color: "#7A736A", fontStyle: "italic" }}>
            No one on the path by that name. Try a different search.
          </div>
        ) : null}
      </div>

      {showInvite ? (
        <div
          onClick={() => setShowInvite(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(28,23,18,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 420,
              background: "#F2E6BC",
              border: "1px solid #D4CDBF",
              borderRadius: 14,
              padding: 26,
              boxShadow: "0 20px 60px rgba(28,23,18,0.35)",
            }}
          >
            <div style={{ fontFamily: "var(--font-serif)", fontWeight: 700, fontSize: 21 }}>
              Invite someone to the path
            </div>
            <div style={{ fontSize: 13, color: "#7A736A", marginTop: 4, lineHeight: 1.5 }}>
              They&apos;ll receive a letter, not a link-blast. Their companion is chosen when they arrive.
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 18 }}>
              <div>
                <div style={{ fontSize: 11.5, fontWeight: 500, color: "#7A736A", marginBottom: 4 }}>Name</div>
                <input
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="e.g. june"
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 8,
                    border: "1px solid #D4CDBF",
                    background: "#EDE4D0",
                    fontSize: 13.5,
                    color: "#1C1712",
                  }}
                />
              </div>
              <div>
                <div style={{ fontSize: 11.5, fontWeight: 500, color: "#7A736A", marginBottom: 4 }}>Email</div>
                <input
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="name@example.com"
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 8,
                    border: "1px solid #D4CDBF",
                    background: "#EDE4D0",
                    fontSize: 13.5,
                    color: "#1C1712",
                  }}
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
              <button
                onClick={() => setShowInvite(false)}
                style={{
                  padding: "9px 16px",
                  borderRadius: 8,
                  border: "1px solid #D4CDBF",
                  background: "transparent",
                  cursor: "pointer",
                  color: "#7A736A",
                  fontWeight: 500,
                  fontSize: 13,
                }}
              >
                Not now
              </button>
              <button
                onClick={sendInvite}
                disabled={sending}
                className="hover:bg-[#B37A31]!"
                style={{
                  padding: "9px 18px",
                  borderRadius: 8,
                  border: "none",
                  cursor: "pointer",
                  background: "#C4873A",
                  color: "#1C1712",
                  fontWeight: 600,
                  fontSize: 13,
                  opacity: sending ? 0.7 : 1,
                }}
              >
                Send invitation
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
