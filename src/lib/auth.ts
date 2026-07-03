import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "tl_session";

function secret(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(s);
}

export function allowedEmails(): string[] {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAllowed(email: string): boolean {
  return allowedEmails().includes(email.trim().toLowerCase());
}

export type Session = { email: string; role: "steward" };

export async function createSessionToken(email: string): Promise<string> {
  return new SignJWT({ role: "steward" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(email)
    .setAudience("throughline-admin")
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
}

export async function verifySessionToken(token: string): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, secret(), { audience: "throughline-admin" });
    if (payload.role !== "steward" || !payload.sub) return null;
    return { email: payload.sub, role: "steward" };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<Session | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/** One-time magic-link token, 15 minutes. */
export async function createLoginToken(email: string): Promise<string> {
  return new SignJWT({ kind: "login" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(email)
    .setAudience("throughline-admin-login")
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(secret());
}

export async function verifyLoginToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secret(), { audience: "throughline-admin-login" });
    if (payload.kind !== "login" || !payload.sub) return null;
    return payload.sub;
  } catch {
    return null;
  }
}

/** Short-lived read-only token for the subscriber-facing app ("view as"). */
export async function createImpersonationToken(subscriberId: string, actorEmail: string): Promise<string> {
  return new SignJWT({ kind: "impersonation", readOnly: true, actorEmail })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(subscriberId)
    .setAudience("throughline-subscriber-app")
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(secret());
}
