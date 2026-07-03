/**
 * Replays realistic telemetry against POST /api/ingest/telemetry so the console
 * is demonstrably live end-to-end before real services connect.
 *
 * Usage:
 *   SIMULATE_URL=http://localhost:3000 SERVICE_TOKENS=weaver:tok,... pnpm simulate
 *
 * SERVICE_TOKENS uses the same format the server reads, so point it at the same value.
 */

const BASE = process.env.SIMULATE_URL || "http://localhost:3000";

function tokens(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const pair of (process.env.SERVICE_TOKENS || "").split(",")) {
    const idx = pair.indexOf(":");
    if (idx === -1) continue;
    map[pair.slice(0, idx).trim()] = pair.slice(idx + 1).trim();
  }
  return map;
}

async function send(slug: string, events: unknown[]) {
  const tok = tokens()[slug];
  if (!tok) {
    console.log(`(skip ${slug} — no token in SERVICE_TOKENS)`);
    return;
  }
  const res = await fetch(`${BASE}/api/ingest/telemetry`, {
    method: "POST",
    headers: { Authorization: `Bearer ${tok}`, "Content-Type": "application/json" },
    body: JSON.stringify({ events }),
  });
  console.log(`${slug}: ${res.status} ${JSON.stringify(await res.json())}`);
}

async function main() {
  const now = new Date();
  const startedAt = new Date(now.getTime() - 24 * 60000).toISOString();

  // products heartbeat + a live session for myke
  await send("weaver", [
    { type: "heartbeat", status: "ok", note: "Web + iPad · simulated" },
    { type: "session", subscriberEmail: "myke@throughline.family", product: "weaver", startedAt, endedAt: now.toISOString(), durationMin: 24 },
    { type: "log", severity: "info", message: "myke placed 3 new stones in the River (simulated)" },
  ]);
  await send("witness", [
    { type: "heartbeat", status: "ok", note: "Apple TV · simulated" },
    { type: "session", subscriberEmail: "mom@throughline.family", product: "witness", startedAt, endedAt: now.toISOString(), durationMin: 31 },
  ]);
  await send("narrator", [
    { type: "heartbeat", status: "ok", note: "Seth & Miriam responsive · simulated" },
    { type: "log", severity: "info", message: "Miriam session warmed — median response 1.7s (simulated)" },
  ]);

  // photo pipeline
  await send("photo-ingestion", [
    { type: "heartbeat", status: "ok", note: "simulated run" },
    { type: "photo", subscriberEmail: "myke@throughline.family", storageKey: `subscribers/myke/sim_${Date.now()}.heic`, exifTakenAt: now.toISOString() },
    { type: "log", severity: "info", message: "1 photo processed in simulated batch — 41ms" },
  ]);

  // a degraded genealogy feed, as in the prototype
  await send("genealogy-feed", [
    { type: "heartbeat", status: "degraded", note: "Upstream 429s — backoff active, 3 records deferred" },
    { type: "log", severity: "error", message: "Upstream genealogy API returned 429 — retry backoff at 6m (simulated)" },
  ]);

  await send("historical-archive", [
    { type: "heartbeat", status: "ok", note: "412 events indexed · coverage 1800–2026" },
    { type: "historical_event", title: "Simulated archive record", year: 1907, era: "settlement", sourceRef: "sim/1" },
  ]);

  console.log("Telemetry replay complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
