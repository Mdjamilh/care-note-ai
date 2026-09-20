import "server-only";

import path from "node:path";

import { env } from "@/lib/env";
import type { Database } from "./types";

declare global {
  // Cached across hot reloads in development so we don't open a new pool per edit.
  var __db: Promise<Database> | undefined;
}

async function connect(): Promise<Database> {
  const schema = await import("./schema");

  if (env.DATABASE_URL) {
    const { drizzle } = await import("drizzle-orm/postgres-js");
    const postgres = (await import("postgres")).default;
    return drizzle(postgres(env.DATABASE_URL, { max: 5, prepare: false }), { schema });
  }

  // No DATABASE_URL: embedded Postgres (PGlite), so `npm run dev` needs no setup.
  // In memory on Vercel (read-only filesystem), in e2e runs and during builds.
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");

  const inMemory =
    process.env.VERCEL || process.env.PGLITE_IN_MEMORY === "1" || process.env.NEXT_PHASE === "phase-production-build";
  const db = drizzle(new PGlite(inMemory ? undefined : path.join(process.cwd(), ".pglite")), { schema });
  await migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
  return db;
}

export function getDb(): Promise<Database> {
  globalThis.__db ??= connect().catch((error) => {
    globalThis.__db = undefined;
    throw error;
  });
  return globalThis.__db;
}
