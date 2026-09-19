import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "kickboard_admin";
const MAX_AGE_SECONDS = 60 * 60 * 12; // 12 hours — long enough for a tournament day.

function secret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ??
    process.env.ADMIN_PASSWORD ??
    "kickboard-insecure-development-secret"
  );
}

function sign(value: string): string {
  return createHmac("sha256", secret()).update(value).digest("hex");
}

/** Constant-time compare that tolerates differing lengths. */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export function verifyPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return safeEqual(input, expected);
}

function makeToken(): string {
  const expiresAt = Date.now() + MAX_AGE_SECONDS * 1000;
  const payload = String(expiresAt);
  return `${payload}.${sign(payload)}`;
}

export function isValidToken(token: string | undefined): boolean {
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  if (!safeEqual(signature, sign(payload))) return false;

  const expiresAt = Number(payload);
  return Number.isFinite(expiresAt) && expiresAt > Date.now();
}

export async function createSession() {
  const store = await cookies();
  store.set(COOKIE_NAME, makeToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function isAuthenticated(): Promise<boolean> {
  const store = await cookies();
  return isValidToken(store.get(COOKIE_NAME)?.value);
}

/** Guard for admin API routes. Returns null when the caller is authorised. */
export async function requireAdmin(): Promise<Response | null> {
  if (await isAuthenticated()) return null;
  return Response.json({ error: "Unauthorised" }, { status: 401 });
}

export { COOKIE_NAME };
