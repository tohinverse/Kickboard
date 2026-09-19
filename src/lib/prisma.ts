import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

/**
 * The client is created lazily on first use rather than at import time.
 *
 * `next build` imports every route to collect its config, so an eager client
 * would make the build require a live DATABASE_URL — awkward in CI and in the
 * Docker image build, where no database exists yet. Deferring it keeps the
 * build database-free while still failing loudly on the first real query if
 * the environment is genuinely misconfigured.
 */
function createClient(): PrismaClient {
  const connectionString =
    process.env.DATABASE_URL ?? process.env.POSTGRES_PRISMA_URL ?? process.env.POSTGRES_URL;

  if (!connectionString) {
    throw new Error(
      "No database connection string. Set DATABASE_URL (or POSTGRES_PRISMA_URL) in the environment.",
    );
  }

  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, property, receiver) {
    // Cached on globalThis so dev hot-reloads reuse one connection pool.
    const client = (globalForPrisma.prisma ??= createClient());
    return Reflect.get(client, property, receiver);
  },
});
