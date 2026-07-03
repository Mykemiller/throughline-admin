/**
 * Production seed (idempotent, safe to re-run):
 *  - ensures the sole steward account (never resets an existing password)
 *  - installs the 7 real chapters (from the product's "Your story" screen)
 *  - registers the 9 services awaiting their first heartbeat (never clobbers
 *    a service that has already reported in)
 *  - one-time cleanup: if the prototype demo dataset is present, removes it
 *    (real product subscribers arrive via the bridge sync; engagement and
 *    logs arrive via telemetry)
 *
 * For the design-fidelity demo dataset, use `pnpm seed:demo` instead.
 */
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/passwords";

const prisma = new PrismaClient();

const ADMIN_EMAIL = "mykemiller@gmail.com";
const ADMIN_INITIAL_PASSWORD = "Seth";

const CHAPTER_TITLES = [
  "First Light",
  "The School Years",
  "Becoming",
  "The World You Built",
  "What Stayed",
  "Still Becoming",
  "Last Night",
];

const SERVICES = [
  "Photo Ingestion",
  "Genealogy Feed",
  "Historical Archive",
  "AI Service Core (Narrator)",
  "Weaver",
  "Surfer",
  "Witness",
  "Reunion",
  "Scout",
];

const DEMO_EMAILS = [
  "myke@throughline.family",
  "mom@throughline.family",
  "mark@throughline.family",
  "lynn@throughline.family",
  "june.h@gmail.com",
  "sara.w@gmail.com",
  "paul.d@gmail.com",
  "ann.b@gmail.com",
  "beth.k@gmail.com",
  "tom.r@gmail.com",
];

async function main() {
  console.log("Steward account…");
  const admin = await prisma.adminUser.findUnique({ where: { email: ADMIN_EMAIL } });
  if (!admin) {
    await prisma.adminUser.create({
      data: { email: ADMIN_EMAIL, passwordHash: hashPassword(ADMIN_INITIAL_PASSWORD) },
    });
    console.log(`  created ${ADMIN_EMAIL} with the initial key`);
  } else {
    console.log(`  ${ADMIN_EMAIL} exists — password untouched`);
  }

  const demoSubs = await prisma.subscriber.findMany({
    where: { email: { in: DEMO_EMAILS }, productId: null },
    select: { id: true },
  });
  if (demoSubs.length) {
    console.log(`Removing prototype demo dataset (${demoSubs.length} demo subscribers)…`);
    const ids = demoSubs.map((s) => s.id);
    await prisma.$transaction([
      prisma.auditEvent.deleteMany({ where: { subscriberId: { in: ids } } }),
      prisma.logEvent.deleteMany(),
      prisma.payment.deleteMany({ where: { subscriberId: { in: ids } } }),
      prisma.familyMember.deleteMany({ where: { subscriberId: { in: ids } } }),
      prisma.chapterProgress.deleteMany({ where: { subscriberId: { in: ids } } }),
      prisma.photo.deleteMany({
        where: { OR: [{ subscriberId: { in: ids } }, { storageKey: { startsWith: "archives/regional/" } }] },
      }),
      prisma.engagementSession.deleteMany({ where: { subscriberId: { in: ids } } }),
      prisma.historicalEvent.deleteMany({
        where: { OR: [{ sourceRef: { startsWith: "archive/ref-" } }, { sourceRef: "loc.gov/homestead" }] },
      }),
      prisma.subscriber.deleteMany({ where: { id: { in: ids } } }),
    ]);
  }

  console.log("Chapters (the real 7)…");
  const chapters = await prisma.chapter.findMany({ orderBy: { ordinal: "asc" } });
  const matches =
    chapters.length === CHAPTER_TITLES.length &&
    chapters.every((c, i) => c.title === CHAPTER_TITLES[i] && c.ordinal === i + 1);
  if (!matches) {
    await prisma.$transaction([
      prisma.chapterProgress.deleteMany(), // re-derived from chapter_progress by the bridge sync
      prisma.chapter.deleteMany(),
    ]);
    for (let i = 0; i < CHAPTER_TITLES.length; i++) {
      await prisma.chapter.create({ data: { ordinal: i + 1, title: CHAPTER_TITLES[i] } });
    }
    console.log(`  installed ${CHAPTER_TITLES.length} chapters`);
  } else {
    console.log("  chapters already current");
  }

  console.log("Service registry…");
  for (const name of SERVICES) {
    await prisma.service.upsert({
      where: { name },
      create: { name, status: "ok", note: "awaiting first heartbeat" },
      update: {}, // never clobber a service that has reported in
    });
  }
  // a service that has never heartbeated carries no real state — clear any demo leftovers
  await prisma.service.updateMany({
    where: { heartbeatAt: null },
    data: { status: "ok", note: "awaiting first heartbeat" },
  });

  const [subs, chaptersCount, services] = await Promise.all([
    prisma.subscriber.count(),
    prisma.chapter.count(),
    prisma.service.count(),
  ]);
  console.log(`Done: ${subs} subscribers (admin schema) · ${chaptersCount} chapters · ${services} services`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
