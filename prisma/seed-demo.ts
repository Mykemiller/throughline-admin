/**
 * DEMO seed (`pnpm seed:demo`) — restores the design-prototype dataset for
 * demos and e2e runs. DESTRUCTIVE: wipes the admin schema's business tables,
 * including subscribers synced from the product (they re-sync on next page
 * load, but steward-set statuses are lost). Production bootstrap is seed.ts.
 *
 * Counters it must produce: 1,284 photos (831 subscriber uploads + 453 archive),
 * 10 subscribers, 86 family members (11 through dialogue), 412 historical events,
 * 9 services (Genealogy Feed degraded), 12 log events, 12 chapters.
 */
import { PrismaClient, type Companion, type Plan, type Product, type Severity, type SubscriberStatus } from "@prisma/client";
import { hashPassword } from "../src/lib/passwords";

const prisma = new PrismaClient();

// The sole authorized steward. Created only if missing — the seed NEVER resets
// an existing password (Myke rotates it in the Account screen).
const ADMIN_EMAIL = "mykemiller@gmail.com";
const ADMIN_INITIAL_PASSWORD = "Seth";
const TZ = "America/Los_Angeles";

/** Date at local (LA) wall-clock time, daysAgo days before today. */
function at(daysAgo: number, hh: number, mm: number): Date {
  const now = new Date();
  const laNow = new Date(now.toLocaleString("en-US", { timeZone: TZ }));
  const offsetMs = now.getTime() - laNow.getTime();
  const d = new Date(laNow);
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hh, mm, 0, 0);
  return new Date(d.getTime() + offsetMs);
}

/** Date for an absolute 2026 calendar day (noon LA, so it formats stably). */
function onDay(month: number, day: number, year = 2026): Date {
  const utcGuess = new Date(Date.UTC(year, month - 1, day, 19, 0, 0)); // noon LA ≈ 19-20 UTC
  return utcGuess;
}

// deterministic pseudo-random
let lcg = 42;
function rand(): number {
  lcg = (lcg * 1664525 + 1013904223) % 4294967296;
  return lcg / 4294967296;
}

type SeedSub = {
  key: string;
  name: string;
  email: string;
  plan: Plan;
  companion: Companion;
  status: SubscriberStatus;
  minutes: Partial<Record<Product, number>>;
  photos: number;
  chapters: number;
  joined: Date;
  invited?: Date;
  lastActive: Date | null;
  people: { name: string; relation: string; via: string; added: Date }[];
};

const SUBS: SeedSub[] = [
  {
    key: "myke", name: "myke", email: "myke@throughline.family", plan: "founding", companion: "miriam",
    status: "active", photos: 214, chapters: 9, joined: onDay(1, 12), lastActive: at(0, 9, 12),
    minutes: { weaver: 820, surfer: 340, witness: 260, reunion: 140, scout: 110, narrator: 170 },
    people: [
      { name: "Frederick Bull", relation: "great-grandfather", via: "Chapter 6", added: onDay(6, 28) },
      { name: "Fannie Bull", relation: "great-grandmother", via: "Chapter 6", added: onDay(6, 28) },
      { name: "Thomas Bull", relation: "great-great-grandfather", via: "Chapter 8", added: onDay(7, 1) },
    ],
  },
  {
    key: "mom", name: "mom", email: "mom@throughline.family", plan: "family", companion: "seth",
    status: "active", photos: 187, chapters: 11, joined: onDay(1, 12), lastActive: at(0, 7, 48),
    minutes: { weaver: 760, surfer: 180, witness: 890, reunion: 190, scout: 60, narrator: 130 },
    people: [
      { name: "Harold", relation: "father", via: "Chapter 3", added: onDay(3, 4) },
      { name: "Ruth", relation: "mother", via: "Chapter 3", added: onDay(3, 4) },
      { name: "Evelyn", relation: "sister", via: "Chapter 9", added: onDay(6, 14) },
    ],
  },
  {
    key: "mark", name: "mark", email: "mark@throughline.family", plan: "family", companion: "miriam",
    status: "active", photos: 96, chapters: 6, joined: onDay(2, 2), lastActive: at(0, 7, 21),
    minutes: { weaver: 410, surfer: 220, witness: 120, reunion: 130, scout: 40, narrator: 40 },
    people: [{ name: "Walter", relation: "grandfather", via: "Chapter 4", added: onDay(4, 19) }],
  },
  {
    key: "lynn", name: "lynn", email: "lynn@throughline.family", plan: "family", companion: "seth",
    status: "active", photos: 142, chapters: 8, joined: onDay(2, 2), lastActive: at(1, 20, 2),
    minutes: { weaver: 520, surfer: 310, witness: 280, reunion: 90, scout: 60, narrator: 50 },
    people: [
      { name: "Edith", relation: "grandmother", via: "Chapter 5", added: onDay(5, 2) },
      { name: "June", relation: "aunt", via: "Chapter 7", added: onDay(6, 9) },
    ],
  },
  {
    key: "june", name: "june", email: "june.h@gmail.com", plan: "solo", companion: "seth",
    status: "active", photos: 45, chapters: 4, joined: onDay(3, 15), lastActive: onDay(6, 30),
    minutes: { weaver: 260, witness: 160, reunion: 40, scout: 50, narrator: 30 },
    people: [{ name: "Dorothy", relation: "mother", via: "Chapter 2", added: onDay(4, 3) }],
  },
  {
    key: "sara", name: "sara", email: "sara.w@gmail.com", plan: "solo", companion: "seth",
    status: "active", photos: 61, chapters: 3, joined: onDay(4, 8), lastActive: onDay(7, 1),
    minutes: { weaver: 210, witness: 90, scout: 50, narrator: 30 },
    people: [],
  },
  {
    key: "paul", name: "paul", email: "paul.d@gmail.com", plan: "solo", companion: "miriam",
    status: "suspended", photos: 12, chapters: 1, joined: onDay(4, 20), lastActive: onDay(5, 30),
    minutes: { weaver: 80, witness: 20, scout: 10, narrator: 10 },
    people: [],
  },
  {
    key: "ann", name: "ann", email: "ann.b@gmail.com", plan: "solo", companion: "seth",
    status: "active", photos: 74, chapters: 5, joined: onDay(5, 1), lastActive: onDay(6, 29),
    minutes: { weaver: 300, surfer: 90, witness: 130, reunion: 30, scout: 30, narrator: 30 },
    people: [{ name: "George", relation: "grandfather", via: "Chapter 3", added: onDay(6, 2) }],
  },
  {
    key: "beth", name: "beth", email: "beth.k@gmail.com", plan: "solo", companion: "seth",
    status: "invited", photos: 0, chapters: 0, joined: onDay(6, 26), invited: onDay(6, 26), lastActive: null,
    minutes: {}, people: [],
  },
  {
    key: "tom", name: "tom", email: "tom.r@gmail.com", plan: "solo", companion: "miriam",
    status: "invited", photos: 0, chapters: 0, joined: onDay(7, 1), invited: onDay(7, 1), lastActive: null,
    minutes: {}, people: [],
  },
];

const CHAPTER_TITLES = [
  "Headwaters", "First Stones", "The Family Table", "Old Roads", "Letters & Ledgers", "The Long Field",
  "War & Weather", "Crossings", "The Quiet Years", "New Ground", "Confluence", "The River Entire",
];

const SERVICES: { name: string; status: "ok" | "degraded"; note: string }[] = [
  { name: "Photo Ingestion", status: "ok", note: "1,284 photos processed · 38ms median" },
  { name: "Genealogy Feed", status: "degraded", note: "Upstream 429s — backoff active, 3 records deferred" },
  { name: "Historical Archive", status: "ok", note: "412 events indexed · coverage 1800–2026" },
  { name: "AI Service Core (Narrator)", status: "ok", note: "Seth & Miriam responsive · 1.9s median" },
  { name: "Weaver", status: "ok", note: "Web + iPad · 4 sessions today" },
  { name: "Surfer", status: "ok", note: "Vision Pro · 1 session today" },
  { name: "Witness", status: "ok", note: "Apple TV · 2 devices reporting" },
  { name: "Reunion", status: "ok", note: "1 gathering scheduled" },
  { name: "Scout", status: "ok", note: "iPhone + Watch · pins resolving" },
];

const LOGS: { h: number; m: number; sev: Severity; source: string; msg: string }[] = [
  { h: 9, m: 41, sev: "error", source: "Genealogy Feed", msg: "Upstream genealogy API returned 429 — retry backoff at 6m, 3 records deferred" },
  { h: 9, m: 12, sev: "warn", source: "Photo Ingestion", msg: "EXIF timestamp missing on 3 of myke's uploads — era placement estimated" },
  { h: 8, m: 55, sev: "info", source: "AI Service Core (Narrator)", msg: "Seth voice model warmed — median response 1.9s" },
  { h: 8, m: 30, sev: "error", source: "Historical Archive", msg: "Event dedupe conflict: 'Homestead Act, 1862' matched 2 archive records — held for review" },
  { h: 8, m: 2, sev: "warn", source: "Surfer", msg: "Vision Pro session for lynn dropped mid-scene — auto-resumed at last stone" },
  { h: 7, m: 48, sev: "info", source: "Weaver", msg: "mom completed Chapter 11 — 14 new stones placed in the River" },
  { h: 7, m: 21, sev: "info", source: "Reunion", msg: "Gathering scheduled by mark — 4 invitations sent" },
  { h: 6, m: 58, sev: "warn", source: "Witness", msg: "Apple TV heartbeat late from device 'den-tv' (mom) — 11 minute gap" },
  { h: 6, m: 40, sev: "info", source: "Scout", msg: "Location pin resolved: Auburn, WA → 2 family events nearby" },
  { h: 6, m: 12, sev: "error", source: "Photo Ingestion", msg: "Checksum failed for IMG_4471.heic (paul) — client asked to resend" },
  { h: 5, m: 30, sev: "info", source: "Genealogy Feed", msg: "Nightly sync complete — 12 family members updated, 0 conflicts" },
  { h: 4, m: 15, sev: "info", source: "Historical Archive", msg: "412 events indexed — River coverage 1800–2026 complete" },
];

const PLAN_CENTS: Record<Plan, number> = { founding: 24900, family: 14900, solo: 7900 };

const ERA_RANGES: [string, number, number][] = [
  ["frontier", 1800, 1869],
  ["settlement", 1870, 1913],
  ["interwar", 1914, 1945],
  ["postwar", 1946, 1979],
  ["modern", 1980, 2009],
  ["contemporary", 2010, 2026],
];

const EVENT_TEMPLATES = [
  "Regional census", "Rail line opened", "County fair records", "Church registry entry", "Land parcel filing",
  "School enrollment ledger", "Harvest report", "Town charter amendment", "Newspaper front page", "Parish record",
  "Flood high-water mark", "Bridge dedication", "Voting rolls", "Homestead claim", "Mill opening",
];

function eraFor(year: number): string {
  for (const [era, lo, hi] of ERA_RANGES) if (year >= lo && year <= hi) return era;
  return "contemporary";
}

const GENEALOGY_NAMES = [
  "Albert", "Bess", "Clara", "Daniel", "Edna", "Frank", "Grace", "Henry", "Ida", "Jacob", "Katherine", "Louis",
  "Mabel", "Ned", "Opal", "Peter", "Queenie", "Rose", "Samuel", "Tessa", "Ulysses", "Vera", "Wesley", "Xenia", "York",
];
const GENEALOGY_RELATIONS = [
  "great-uncle", "great-aunt", "second cousin", "great-great-grandmother", "great-great-grandfather",
  "cousin once removed", "great-grandmother", "great-grandfather",
];

async function main() {
  console.log("Steward account…");
  const existingAdmin = await prisma.adminUser.findUnique({ where: { email: ADMIN_EMAIL } });
  if (!existingAdmin) {
    await prisma.adminUser.create({
      data: { email: ADMIN_EMAIL, passwordHash: hashPassword(ADMIN_INITIAL_PASSWORD) },
    });
    console.log(`  created ${ADMIN_EMAIL} with the initial key`);
  } else {
    console.log(`  ${ADMIN_EMAIL} exists — password untouched`);
  }

  console.log("Clearing admin schema…");
  await prisma.$transaction([
    prisma.auditEvent.deleteMany(),
    prisma.logEvent.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.familyMember.deleteMany(),
    prisma.chapterProgress.deleteMany(),
    prisma.photo.deleteMany(),
    prisma.engagementSession.deleteMany(),
    prisma.historicalEvent.deleteMany(),
    prisma.service.deleteMany(),
    prisma.chapter.deleteMany(),
    prisma.subscriber.deleteMany(),
  ]);

  console.log("Chapters…");
  const chapters = [];
  for (let i = 0; i < 12; i++) {
    chapters.push(await prisma.chapter.create({ data: { ordinal: i + 1, title: CHAPTER_TITLES[i] } }));
  }

  console.log("Subscribers, sessions, chapters, family, payments…");
  let dialogueCount = 0;
  let subscriberPhotoCount = 0;
  for (const s of SUBS) {
    const sub = await prisma.subscriber.create({
      data: {
        name: s.name,
        email: s.email,
        plan: s.plan,
        companion: s.companion,
        status: s.status,
        joinedAt: s.joined,
        invitedAt: s.invited ?? null,
        lastActiveAt: s.lastActive,
      },
    });

    // engagement sessions: 2 sessions per product with minutes, summing exactly
    const sessions: { product: Product; startedAt: Date; endedAt: Date; durationMin: number }[] = [];
    for (const [product, total] of Object.entries(s.minutes) as [Product, number][]) {
      if (!total) continue;
      const first = Math.floor(total / 2);
      const parts = total > 60 ? [first, total - first] : [total];
      parts.forEach((durationMin, i) => {
        const startedAt = at(3 + Math.floor(rand() * 40) + i, 8 + Math.floor(rand() * 10), Math.floor(rand() * 60));
        sessions.push({
          product,
          startedAt,
          endedAt: new Date(startedAt.getTime() + durationMin * 60000),
          durationMin,
        });
      });
    }
    if (sessions.length) {
      await prisma.engagementSession.createMany({
        data: sessions.map((x) => ({ ...x, subscriberId: sub.id })),
      });
    }

    // chapter progress
    if (s.chapters > 0) {
      await prisma.chapterProgress.createMany({
        data: chapters.slice(0, s.chapters).map((c, i) => ({
          subscriberId: sub.id,
          chapterId: c.id,
          completedAt: at(Math.max(1, (s.chapters - i) * 12), 17, 30),
        })),
      });
    }

    // photos (subscriber uploads)
    if (s.photos > 0) {
      await prisma.photo.createMany({
        data: Array.from({ length: s.photos }, (_, i) => ({
          subscriberId: sub.id,
          storageKey: `subscribers/${s.key}/photo_${String(i + 1).padStart(4, "0")}.heic`,
          source: "subscriber_upload",
          exifTakenAt: rand() > 0.15 ? at(Math.floor(rand() * 150) + 3, 12, 0) : null,
          eraEstimated: rand() <= 0.15,
          checksumOk: !(s.key === "paul" && i === 0),
          ingestedAt: at(Math.floor(rand() * 60) + 1, 10, 0),
        })),
      });
      subscriberPhotoCount += s.photos;
    }

    // family added through dialogue
    for (const p of s.people) {
      await prisma.familyMember.create({
        data: {
          subscriberId: sub.id,
          name: p.name,
          relation: p.relation,
          addedVia: p.via,
          addedAt: p.added,
          source: "dialogue",
        },
      });
      dialogueCount++;
    }

    // payments
    if (s.status !== "invited") {
      const n = s.plan === "solo" ? 1 : 2;
      for (let i = 0; i < n; i++) {
        await prisma.payment.create({
          data: {
            subscriberId: sub.id,
            amountCents: PLAN_CENTS[s.plan],
            paidAt: new Date(s.joined.getTime() + i * 30 * 24 * 3600 * 1000),
          },
        });
      }
    }
  }

  console.log("Genealogy-feed family members (to 86 total)…");
  const allSubs = await prisma.subscriber.findMany({ where: { status: { not: "invited" } } });
  const genealogyTarget = 86 - dialogueCount;
  const genealogyRows = Array.from({ length: genealogyTarget }, (_, i) => {
    const sub = allSubs[i % allSubs.length];
    return {
      subscriberId: sub.id,
      name: `${GENEALOGY_NAMES[i % GENEALOGY_NAMES.length]} ${sub.name === "myke" ? "Bull" : "Miller"}`,
      relation: GENEALOGY_RELATIONS[i % GENEALOGY_RELATIONS.length],
      addedVia: "genealogy sync",
      addedAt: at(Math.floor(rand() * 90) + 2, 3, 30),
      source: "genealogy_feed",
    };
  });
  await prisma.familyMember.createMany({ data: genealogyRows });

  console.log("Archive photos (to 1,284 total)…");
  const archiveCount = 1284 - subscriberPhotoCount;
  await prisma.photo.createMany({
    data: Array.from({ length: archiveCount }, (_, i) => ({
      storageKey: `archives/regional/scan_${String(i + 1).padStart(5, "0")}.tif`,
      source: "archive_import",
      exifTakenAt: null,
      eraEstimated: true,
      checksumOk: true,
      ingestedAt: at(Math.floor(rand() * 120) + 1, 2, 0),
    })),
  });

  console.log("Historical events (412)…");
  const events: { title: string; year: number; era: string; sourceRef: string; dedupeKey: string }[] = [];
  const seen = new Set<string>();
  const homestead = { title: "Homestead Act, 1862", year: 1862, era: "frontier", sourceRef: "loc.gov/homestead", dedupeKey: "Homestead Act, 1862::1862" };
  events.push(homestead);
  seen.add(homestead.dedupeKey);
  let n = 0;
  while (events.length < 412) {
    const year = 1800 + Math.floor(rand() * 227);
    const title = `${EVENT_TEMPLATES[n % EVENT_TEMPLATES.length]}, ${year}`;
    n++;
    const dedupeKey = `${title}::${year}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    events.push({ title, year, era: eraFor(year), sourceRef: `archive/ref-${String(n).padStart(4, "0")}`, dedupeKey });
  }
  await prisma.historicalEvent.createMany({ data: events });

  console.log("Services + logs…");
  const serviceIds = new Map<string, string>();
  for (const sv of SERVICES) {
    const row = await prisma.service.create({
      data: { name: sv.name, status: sv.status, note: sv.note, heartbeatAt: null },
    });
    serviceIds.set(sv.name, row.id);
  }
  for (const lg of LOGS) {
    await prisma.logEvent.create({
      data: {
        serviceId: serviceIds.get(lg.source)!,
        severity: lg.sev,
        message: lg.msg,
        createdAt: at(0, lg.h, lg.m),
      },
    });
  }

  const [photos, subs, family, eventsCount] = await Promise.all([
    prisma.photo.count(),
    prisma.subscriber.count(),
    prisma.familyMember.count(),
    prisma.historicalEvent.count(),
  ]);
  console.log(`Done: ${photos} photos · ${subs} subscribers · ${family} family members · ${eventsCount} events`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
