import fs from "fs";
import path from "path";
import type { DbShape } from "./types";
import { buildSeed } from "./seed";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "db.json");

// No in-memory cache here on purpose: Next.js dev (Turbopack) compiles route
// handlers and server components as separate module instances, so a
// module-level cache variable does not stay in sync across them. The JSON
// file on disk is the single source of truth; every call re-reads it.
function ensureFile(): DbShape {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    const seed = buildSeed();
    fs.writeFileSync(DB_PATH, JSON.stringify(seed, null, 2), "utf-8");
    return seed;
  }
  const raw = fs.readFileSync(DB_PATH, "utf-8");
  return JSON.parse(raw) as DbShape;
}

export function readDb(): DbShape {
  return ensureFile();
}

export function writeDb(next: DbShape) {
  fs.writeFileSync(DB_PATH, JSON.stringify(next, null, 2), "utf-8");
}

export function mutateDb<T>(fn: (db: DbShape) => T): T {
  const db = readDb();
  const result = fn(db);
  writeDb(db);
  return result;
}

export function genId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function genOrderCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
