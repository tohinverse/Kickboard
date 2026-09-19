import path from "node:path";
import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

// The Prisma CLI does not populate process.env from .env before loading this
// file, so the connection string is read in explicitly.
loadEnv({ path: ".env", quiet: true });

/**
 * Migrations need a direct (non-pooled) connection. Vercel Postgres / Neon
 * expose that as POSTGRES_URL_NON_POOLING; locally DATABASE_URL is usually
 * already direct, so fall back to it.
 */
const migrationUrl =
  process.env.DIRECT_DATABASE_URL ??
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.DATABASE_URL ??
  "";

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    path: path.join("prisma", "migrations"),
  },
  datasource: {
    url: migrationUrl,
  },
});
