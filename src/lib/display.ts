import type { Companion, Plan, Product, Severity, SubscriberStatus } from "@prisma/client";

export const statusPill: Record<SubscriberStatus, { bg: string; color: string; label: string }> = {
  active: { bg: "rgba(74,124,89,0.18)", color: "#31573E", label: "Active" },
  invited: { bg: "rgba(196,135,58,0.20)", color: "#8A5D24", label: "Invited" },
  suspended: { bg: "rgba(107,76,42,0.20)", color: "#6B4C2A", label: "Suspended" },
  cancelled: { bg: "rgba(122,115,106,0.20)", color: "#7A736A", label: "Cancelled" },
};

export const sevPill: Record<Severity, { bg: string; color: string }> = {
  error: { bg: "#6B4C2A", color: "#F2E6BC" },
  warn: { bg: "rgba(196,135,58,0.25)", color: "#8A5D24" },
  info: { bg: "rgba(91,143,168,0.20)", color: "#3E637A" },
};

export const planLabel: Record<Plan, string> = {
  founding: "Founding",
  family: "Family",
  solo: "Solo",
};

export const companionLabel: Record<Companion, string> = {
  seth: "Seth",
  miriam: "Miriam",
};

export const productLabel: Record<Product, string> = {
  weaver: "Weaver",
  surfer: "Surfer",
  witness: "Witness",
  reunion: "Reunion",
  scout: "Scout",
  narrator: "Companion (Narrator)",
};

export const serviceDot = (status: string): string =>
  status === "ok" ? "#4A7C59" : status === "degraded" ? "#C4873A" : "#6B4C2A";
