"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Overview" },
  { href: "/subscribers", label: "Subscribers", badge: true },
  { href: "/progress", label: "Progress" },
  { href: "/sources", label: "Sources & Logs" },
] as const;

export function Sidebar({ subCount, envLabel, userName }: { subCount: number; envLabel: string; userName: string }) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <div
      style={{
        width: 236,
        flexShrink: 0,
        background: "#1E2A3A",
        color: "#F2E6BC",
        display: "flex",
        flexDirection: "column",
        padding: "22px 14px 16px",
      }}
    >
      <div style={{ padding: "0 10px 22px" }}>
        <div style={{ fontFamily: "var(--font-serif)", fontWeight: 700, fontSize: 22, letterSpacing: "0.02em" }}>
          Throughline
        </div>
        <div style={{ fontFamily: "var(--font-serif)", fontSize: 13, color: "#C4873A", marginTop: 2, letterSpacing: "0.06em" }}>
          Administrator
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV.map((n) => {
          const active = isActive(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              className="hover:bg-[rgba(242,230,188,0.10)]"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 500,
                textDecoration: "none",
                background: active ? "rgba(242,230,188,0.14)" : "transparent",
                color: active ? "#F2E6BC" : "rgba(242,230,188,0.72)",
              }}
            >
              <div
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  flexShrink: 0,
                  background: active ? "#C4873A" : "rgba(242,230,188,0.35)",
                }}
              />
              <div style={{ flex: 1 }}>{n.label}</div>
              {"badge" in n && n.badge ? (
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    background: "#6B4C2A",
                    color: "#F2E6BC",
                    borderRadius: 99,
                    padding: "1px 8px",
                  }}
                >
                  {subCount}
                </div>
              ) : null}
            </Link>
          );
        })}
      </div>
      <div style={{ flex: 1 }} />
      <div
        style={{
          height: 3,
          borderRadius: 2,
          margin: "0 10px 14px",
          background:
            "linear-gradient(90deg, rgba(91,143,168,0.2), #5B8FA8, rgba(91,143,168,0.3), #5B8FA8, rgba(91,143,168,0.2))",
          backgroundSize: "300% 100%",
          animation: "brookFlow 11s ease-in-out infinite",
        }}
      />
      <Link
        href="/account"
        style={{ padding: "0 10px", display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "#F2E6BC" }}
        title="Account — change the steward's key"
      >
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: "50%",
            background: "#C4873A",
            color: "#1E2A3A",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          {userName[0] ?? "s"}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500 }}>{userName}</div>
          <div style={{ fontSize: 11, color: "#7A736A" }}>steward · {envLabel}</div>
        </div>
      </Link>
    </div>
  );
}
