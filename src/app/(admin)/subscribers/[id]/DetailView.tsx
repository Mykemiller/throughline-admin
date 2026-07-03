"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/Toast";
import { Bar, Card, CardTitle, LabeledBar, MicroLabel, StatusPill } from "@/components/ui";
import { companionLabel } from "@/lib/display";
import type { Companion, Plan, SubscriberStatus } from "@prisma/client";

type Detail = {
  id: string;
  name: string;
  email: string;
  plan: Plan;
  companion: Companion;
  status: SubscriberStatus;
  joined: string;
  lastActive: string;
  engagedLabel: string;
  photos: number;
  chaptersLabel: string;
  chaptersPct: number;
  people: { name: string; relation: string; via: string; date: string }[];
  productRows: { name: string; label: string; pct: number }[];
};

const selectStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: 8,
  border: "1px solid #D4CDBF",
  background: "#F2E6BC",
  fontSize: 13.5,
  color: "#1C1712",
};

export function DetailView({ sub }: { sub: Detail }) {
  const router = useRouter();
  const toast = useToast();
  const [plan, setPlan] = useState<Plan>(sub.plan);
  const [companion, setCompanion] = useState<Companion>(sub.companion);
  const [status, setStatus] = useState<SubscriberStatus>(sub.status);

  async function patch(body: Record<string, string>, opts?: { onOk?: () => void; failBack?: () => void }) {
    try {
      const res = await fetch(`/api/subscribers/${sub.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());
      opts?.onOk?.();
      router.refresh();
    } catch {
      opts?.failBack?.();
      toast("Something went sideways on the path. Give it a moment — we'll find our way back.");
    }
  }

  async function post(path: string): Promise<boolean> {
    try {
      const res = await fetch(path, { method: "POST" });
      if (!res.ok) throw new Error(await res.text());
      return true;
    } catch {
      toast("Something went sideways on the path. Give it a moment — we'll find our way back.");
      return false;
    }
  }

  const suspendLabel = status === "suspended" ? "Reactivate" : "Suspend";

  return (
    <>
      <Link
        href="/subscribers"
        style={{
          display: "inline-block",
          fontSize: 13,
          fontWeight: 500,
          color: "#6B4C2A",
          cursor: "pointer",
          marginBottom: 14,
          textDecoration: "none",
        }}
      >
        ← All subscribers
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            background: "#1E2A3A",
            color: "#F2E6BC",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--font-serif)",
            fontWeight: 600,
            fontSize: 22,
          }}
        >
          {sub.name[0]}
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontFamily: "var(--font-serif)", fontWeight: 700, fontSize: 26 }}>{sub.name}</div>
            <StatusPill status={status} />
          </div>
          <div style={{ fontSize: 13, color: "#7A736A", marginTop: 2 }}>
            {sub.email} · joined {sub.joined} · last active {sub.lastActive}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginTop: 20 }}>
        <Card style={{ padding: 16 }}>
          <MicroLabel>Time on the path</MicroLabel>
          <div style={{ fontFamily: "var(--font-serif)", fontWeight: 700, fontSize: 28, marginTop: 6 }}>
            {sub.engagedLabel}
          </div>
          <div style={{ fontSize: 12, color: "#6B4C2A", marginTop: 2 }}>across all products</div>
        </Card>
        <Card style={{ padding: 16 }}>
          <MicroLabel>Photographs attached</MicroLabel>
          <div style={{ fontFamily: "var(--font-serif)", fontWeight: 700, fontSize: 28, marginTop: 6 }}>{sub.photos}</div>
          <div style={{ fontSize: 12, color: "#6B4C2A", marginTop: 2 }}>stones placed in the River</div>
        </Card>
        <Card style={{ padding: 16 }}>
          <MicroLabel>Chapters completed</MicroLabel>
          <div style={{ fontFamily: "var(--font-serif)", fontWeight: 700, fontSize: 28, marginTop: 6 }}>
            {sub.chaptersLabel}
          </div>
          <div style={{ marginTop: 8 }}>
            <Bar pct={sub.chaptersPct} color="#C4873A" />
          </div>
        </Card>
        <Card style={{ padding: 16 }}>
          <MicroLabel>People added</MicroLabel>
          <div style={{ fontFamily: "var(--font-serif)", fontWeight: 700, fontSize: 28, marginTop: 6 }}>
            {sub.people.length}
          </div>
          <div style={{ fontSize: 12, color: "#6B4C2A", marginTop: 2 }}>
            through dialogue with {companionLabel[companion]}
          </div>
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr 1fr", gap: 14, marginTop: 14 }}>
        <Card>
          <div style={{ fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: 17 }}>Profile</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 14 }}>
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 500, color: "#7A736A", marginBottom: 4 }}>Plan</div>
              <select
                value={plan}
                onChange={(e) => {
                  const prev = plan;
                  const next = e.target.value as Plan;
                  setPlan(next);
                  patch({ plan: next }, { failBack: () => setPlan(prev) });
                }}
                style={selectStyle}
              >
                <option value="founding">Founding</option>
                <option value="family">Family</option>
                <option value="solo">Solo</option>
              </select>
            </div>
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 500, color: "#7A736A", marginBottom: 4 }}>Companion</div>
              <select
                value={companion}
                onChange={(e) => {
                  const prev = companion;
                  const next = e.target.value as Companion;
                  setCompanion(next);
                  patch({ companion: next }, { failBack: () => setCompanion(prev) });
                }}
                style={selectStyle}
              >
                <option value="seth">Seth</option>
                <option value="miriam">Miriam</option>
              </select>
            </div>
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 500, color: "#7A736A", marginBottom: 4 }}>Status</div>
              <select
                value={status}
                onChange={(e) => {
                  const prev = status;
                  const next = e.target.value as SubscriberStatus;
                  setStatus(next);
                  patch({ status: next }, { failBack: () => setStatus(prev) });
                }}
                style={selectStyle}
              >
                <option value="active">Active</option>
                <option value="invited">Invited</option>
                <option value="suspended">Suspended</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          <div style={{ borderTop: "1px solid #D4CDBF", marginTop: 16, paddingTop: 14 }}>
            <MicroLabel>Actions</MicroLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
              <button
                onClick={async () => {
                  if (await post(`/api/subscribers/${sub.id}/impersonate`)) {
                    toast(`Viewing the path as ${sub.name} — impersonation session started`);
                  }
                }}
                className="hover:bg-[#B37A31]!"
                style={{
                  padding: "9px 12px",
                  borderRadius: 8,
                  border: "none",
                  cursor: "pointer",
                  background: "#C4873A",
                  color: "#1C1712",
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                View as {sub.name}
              </button>
              <button
                onClick={() => {
                  const next: SubscriberStatus = status === "suspended" ? "active" : "suspended";
                  const prev = status;
                  setStatus(next);
                  patch(
                    { status: next },
                    {
                      onOk: () =>
                        toast(
                          next === "suspended"
                            ? `${sub.name} suspended — the stones are held safe`
                            : `${sub.name} reactivated — back on the path`
                        ),
                      failBack: () => setStatus(prev),
                    }
                  );
                }}
                className="hover:bg-[rgba(107,76,42,0.08)]"
                style={{
                  padding: "9px 12px",
                  borderRadius: 8,
                  border: "1px solid #6B4C2A",
                  cursor: "pointer",
                  background: "transparent",
                  color: "#6B4C2A",
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                {suspendLabel}
              </button>
              <button
                onClick={async () => {
                  if (await post(`/api/subscribers/${sub.id}/refund`)) {
                    toast(`Last payment refunded to ${sub.name}`);
                    router.refresh();
                  }
                }}
                className="hover:bg-[rgba(107,76,42,0.08)]"
                style={{
                  padding: "9px 12px",
                  borderRadius: 8,
                  border: "1px solid #6B4C2A",
                  cursor: "pointer",
                  background: "transparent",
                  color: "#6B4C2A",
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                Refund last payment
              </button>
              <button
                onClick={() => {
                  const prev = status;
                  setStatus("cancelled");
                  patch(
                    { status: "cancelled" },
                    {
                      onOk: () => toast(`${sub.name}'s subscription cancelled — their River is preserved`),
                      failBack: () => setStatus(prev),
                    }
                  );
                }}
                className="hover:border-[#6B4C2A]! hover:text-[#6B4C2A]!"
                style={{
                  padding: "9px 12px",
                  borderRadius: 8,
                  border: "1px solid #D4CDBF",
                  cursor: "pointer",
                  background: "transparent",
                  color: "#7A736A",
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                Cancel subscription
              </button>
            </div>
          </div>
        </Card>

        <Card>
          <CardTitle title="Family added through dialogue" />
          {sub.people.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", marginTop: 10 }}>
              {sub.people.map((p) => (
                <div
                  key={`${p.name}-${p.date}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 0",
                    borderBottom: "1px solid rgba(212,205,191,0.55)",
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: "#4A7C59",
                      color: "#F2E6BC",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "var(--font-serif)",
                      fontSize: 14,
                    }}
                  >
                    {p.name[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: 14.5 }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: "#7A736A" }}>{p.relation}</div>
                  </div>
                  <div style={{ fontSize: 11.5, color: "#7A736A", textAlign: "right" }}>
                    added {p.date}
                    <br />
                    in {p.via}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: "#7A736A", fontStyle: "italic", marginTop: 12 }}>
              No one yet. The walk hasn&apos;t started.
            </div>
          )}
        </Card>

        <Card>
          <div style={{ fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: 17 }}>Time by product</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 11, marginTop: 14 }}>
            {sub.productRows.map((pr) => (
              <LabeledBar key={pr.name} name={pr.name} label={pr.label} pct={pr.pct} color="#4A7C59" />
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
