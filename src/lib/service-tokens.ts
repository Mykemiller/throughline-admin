/**
 * SERVICE_TOKENS env: comma-separated `slug:token` pairs, one per upstream service.
 * Slugs map to Service.name rows below.
 */
export const SERVICE_SLUGS: Record<string, string> = {
  "photo-ingestion": "Photo Ingestion",
  "genealogy-feed": "Genealogy Feed",
  "historical-archive": "Historical Archive",
  narrator: "AI Service Core (Narrator)",
  weaver: "Weaver",
  surfer: "Surfer",
  witness: "Witness",
  reunion: "Reunion",
  scout: "Scout",
};

export function serviceForToken(bearer: string | null): string | null {
  if (!bearer) return null;
  const token = bearer.replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;
  const pairs = (process.env.SERVICE_TOKENS || "").split(",");
  for (const pair of pairs) {
    const idx = pair.indexOf(":");
    if (idx === -1) continue;
    const slug = pair.slice(0, idx).trim();
    const expected = pair.slice(idx + 1).trim();
    if (expected && expected === token && SERVICE_SLUGS[slug]) return SERVICE_SLUGS[slug];
  }
  return null;
}
