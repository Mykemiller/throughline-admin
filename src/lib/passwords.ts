import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

const N = 16384;
const KEYLEN = 64;

/** Format: scrypt$<N>$<saltB64>$<hashB64> */
export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, KEYLEN, { N });
  return `scrypt$${N}$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== "scrypt") return false;
  const n = Number(parts[1]);
  const salt = Buffer.from(parts[2], "base64");
  const expected = Buffer.from(parts[3], "base64");
  if (!Number.isInteger(n) || !salt.length || !expected.length) return false;
  const actual = scryptSync(password, salt, expected.length, { N: n });
  return timingSafeEqual(actual, expected);
}
