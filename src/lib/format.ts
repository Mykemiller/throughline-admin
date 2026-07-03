const TZ = process.env.ADMIN_TIMEZONE || "America/Los_Angeles";

export function fmtTime(min: number): string {
  if (!min) return "0m";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h}h ${m ? `${m}m` : ""}`.trim() : `${m}m`;
}

function partsInTz(d: Date) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const parts = Object.fromEntries(fmt.formatToParts(d).map((p) => [p.type, p.value]));
  return parts as Record<string, string>;
}

function dayKey(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, dateStyle: "short" }).format(d);
}

/** "Jan 12, 2026" */
export function fmtJoined(d: Date): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: TZ, month: "short", day: "numeric", year: "numeric" }).format(d);
}

/** "Jun 28" */
export function fmtShortDate(d: Date): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: TZ, month: "short", day: "numeric" }).format(d);
}

/** "today, 9:12a" · "yesterday, 8:02p" · "Jun 30" · "—" */
export function fmtLastActive(d: Date | null): string {
  if (!d) return "—";
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const p = partsInTz(d);
  const clock = `${p.hour}:${p.minute}${p.dayPeriod === "AM" ? "a" : "p"}`;
  if (dayKey(d) === dayKey(now)) return `today, ${clock}`;
  if (dayKey(d) === dayKey(yesterday)) return `yesterday, ${clock}`;
  return fmtShortDate(d);
}

/** "09:41" for the log */
export function fmtLogTime(d: Date): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false }).format(d);
}

/** "Friday, July 3, 2026" */
export function fmtHeaderDate(d: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(d);
}

export function fmtNumber(n: number): string {
  return n.toLocaleString("en-US");
}
