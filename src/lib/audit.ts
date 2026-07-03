import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export type AuditAction =
  | "impersonate"
  | "suspend"
  | "reactivate"
  | "refund"
  | "cancel"
  | "edit_profile"
  | "invite";

export async function writeAudit(opts: {
  actorEmail: string;
  action: AuditAction;
  subscriberId?: string;
  detail?: Prisma.InputJsonValue;
}) {
  await prisma.auditEvent.create({
    data: {
      actorEmail: opts.actorEmail,
      action: opts.action,
      subscriberId: opts.subscriberId,
      detail: opts.detail,
    },
  });
}
