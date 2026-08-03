import crypto from "crypto";
import { cookies } from "next/headers";
import type { Role, SessionPayload } from "./types";
import { SESSION_COOKIE_NAME as COOKIE_NAME } from "./session-constants";

const MAX_AGE_SECONDS = 60 * 60 * 12; // 12h shift

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET is not set");
  return s;
}

function base64url(input: Buffer): string {
  return input
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function sign(payload: string): string {
  return base64url(
    crypto.createHmac("sha256", secret()).update(payload).digest()
  );
}

export function encodeSession(payload: SessionPayload): string {
  const json = base64url(Buffer.from(JSON.stringify(payload), "utf-8"));
  const sig = sign(json);
  return `${json}.${sig}`;
}

export function decodeSession(token: string | undefined): SessionPayload | null {
  if (!token) return null;
  const [json, sig] = token.split(".");
  if (!json || !sig) return null;
  const expected = sign(json);
  if (
    expected.length !== sig.length ||
    !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))
  ) {
    return null;
  }
  try {
    const buf = Buffer.from(
      json.replace(/-/g, "+").replace(/_/g, "/"),
      "base64"
    );
    return JSON.parse(buf.toString("utf-8")) as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  return decodeSession(store.get(COOKIE_NAME)?.value);
}

export async function setSessionCookie(payload: SessionPayload) {
  const store = await cookies();
  store.set(COOKIE_NAME, encodeSession(payload), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE_SECONDS,
    path: "/",
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export function requireRole(
  session: SessionPayload | null,
  roles: Role[]
): session is SessionPayload {
  return !!session && roles.includes(session.role);
}
