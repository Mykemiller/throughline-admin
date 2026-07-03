"use client";

import { useRouter } from "next/navigation";

export function SourceSelect({ value, severity, options }: { value: string; severity: string; options: string[] }) {
  const router = useRouter();
  return (
    <select
      value={value}
      onChange={(e) => {
        const p = new URLSearchParams();
        if (e.target.value) p.set("source", e.target.value);
        if (severity) p.set("severity", severity);
        const qs = p.toString();
        router.push(qs ? `/sources?${qs}` : "/sources");
      }}
      style={{
        padding: "7px 10px",
        borderRadius: 8,
        border: "1px solid #D4CDBF",
        background: "#F2E6BC",
        fontSize: 12.5,
        color: "#1C1712",
      }}
    >
      <option value="">All sources</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}
