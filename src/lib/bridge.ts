/**
 * Read-only bridge to the Throughline product data (public schema).
 *
 * The app never touches public.* directly: it reads two views in the admin
 * schema — admin.bridge_counts and admin.bridge_subscribers — created by a
 * steward-approved migration (see foundry/sql/bridge-views.sql). Until those
 * views exist, every function here degrades to null / no-op so the console
 * still works.
 */
import { prisma } from "@/lib/prisma";
import type { Companion, Plan, Prisma, SubscriberStatus } from "@prisma/client";

export type BridgeCounts = {
  productSubscribers: number;
  archivePhotos: number;
  subscriberPhotos: number;
  genealogyPersons: number;
  readers: number;
};

type BridgeSubscriberRow = {
  subscriber_id: string;
  name: string | null;
  email: string | null;
  plan_tier: string | null;
  companion_preference: string | null;
  profile_complete: boolean | null;
  created_at: Date;
  chapter_progress: Prisma.JsonValue;
};

export async function getBridgeCounts(): Promise<BridgeCounts | null> {
  try {
    const rows = await prisma.$queryRaw<
      { product_subscribers: bigint; archive_photos: bigint; subscriber_photos: bigint; genealogy_persons: bigint; readers: bigint }[]
    >`select * from "admin"."bridge_counts"`;
    if (!rows.length) return null;
    const r = rows[0];
    return {
      productSubscribers: Number(r.product_subscribers),
      archivePhotos: Number(r.archive_photos),
      subscriberPhotos: Number(r.subscriber_photos),
      genealogyPersons: Number(r.genealogy_persons),
      readers: Number(r.readers),
    };
  } catch {
    return null; // bridge views not installed yet
  }
}

function mapPlan(planTier: string | null): Plan {
  switch ((planTier ?? "").toLowerCase()) {
    case "mvp":
      return "founding";
    case "family":
      return "family";
    default:
      return "solo"; // "standard" and anything unknown
  }
}

function mapCompanion(pref: string | null): Companion {
  return (pref ?? "").toLowerCase().includes("miriam") ? "miriam" : "seth";
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

/**
 * chapter_progress contract: a JSON object whose keys are either chapter
 * ordinals ("1".."7") or slugged titles ("first_light", "the_school_years"…),
 * with truthy values marking the chapter complete. Empty object = no progress.
 */
export function parseCompletedOrdinals(
  progress: Prisma.JsonValue,
  chapters: { ordinal: number; title: string }[]
): number[] {
  if (!progress || typeof progress !== "object" || Array.isArray(progress)) return [];
  const bySlug = new Map(chapters.map((c) => [slugify(c.title), c.ordinal]));
  const ordinals = new Set<number>();
  for (const [key, value] of Object.entries(progress)) {
    if (!value) continue;
    const asNumber = Number(key);
    if (Number.isInteger(asNumber) && chapters.some((c) => c.ordinal === asNumber)) {
      ordinals.add(asNumber);
      continue;
    }
    const viaSlug = bySlug.get(slugify(key));
    if (viaSlug !== undefined) ordinals.add(viaSlug);
  }
  return [...ordinals].sort((a, b) => a - b);
}

/**
 * Upserts real product subscribers into the admin schema.
 *
 * Ownership rules: on first import the product supplies name, email, plan,
 * companion, and derived status (profile_complete ⇒ active, else invited).
 * After that the product refreshes name/email only — plan, companion, and
 * status belong to the steward. Admin-invited rows are linked up by email
 * when the person later appears in the product.
 */
export async function syncSubscribersFromProduct(): Promise<void> {
  let rows: BridgeSubscriberRow[];
  try {
    rows = await prisma.$queryRaw<BridgeSubscriberRow[]>`
      select subscriber_id::text as subscriber_id, name, email, plan_tier,
             companion_preference, profile_complete, created_at, chapter_progress
      from "admin"."bridge_subscribers"`;
  } catch {
    return; // bridge views not installed yet
  }
  if (!rows.length) return;

  const chapters = await prisma.chapter.findMany({ select: { id: true, ordinal: true, title: true } });
  const byOrdinal = new Map(chapters.map((c) => [c.ordinal, c.id]));

  for (const r of rows) {
    const email = r.email?.trim().toLowerCase();
    if (!email) continue;
    const name = r.name?.trim() || email.split("@")[0];

    const existing =
      (await prisma.subscriber.findUnique({ where: { productId: r.subscriber_id } })) ??
      (await prisma.subscriber.findUnique({ where: { email } }));

    let subscriberId: string;
    if (existing) {
      await prisma.subscriber.update({
        where: { id: existing.id },
        data: { productId: r.subscriber_id, name, email },
      });
      subscriberId = existing.id;
    } else {
      const status: SubscriberStatus = r.profile_complete ? "active" : "invited";
      const created = await prisma.subscriber.create({
        data: {
          productId: r.subscriber_id,
          name,
          email,
          plan: mapPlan(r.plan_tier),
          companion: mapCompanion(r.companion_preference),
          status,
          joinedAt: r.created_at,
          invitedAt: status === "invited" ? r.created_at : null,
        },
      });
      subscriberId = created.id;
    }

    for (const ordinal of parseCompletedOrdinals(r.chapter_progress, chapters)) {
      const chapterId = byOrdinal.get(ordinal);
      if (!chapterId) continue;
      await prisma.chapterProgress.upsert({
        where: { subscriberId_chapterId: { subscriberId, chapterId } },
        create: { subscriberId, chapterId, completedAt: new Date() },
        update: {},
      });
    }
  }
}
