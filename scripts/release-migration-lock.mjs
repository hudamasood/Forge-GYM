/**
 * One-off repair: releases Prisma Migrate's advisory lock (72707369) when an
 * idle connection left behind by a connection pooler still holds it, which
 * makes `prisma migrate deploy` fail with P1002. Only idle sessions holding
 * that exact lock are terminated — no data is read or changed.
 *
 * Runs from scripts/vercel-build.mjs when RELEASE_MIGRATION_LOCK=1.
 */
import { PrismaClient } from "@prisma/client";

const PRISMA_MIGRATE_LOCK = 72707369;
const prisma = new PrismaClient();

try {
  const holders = await prisma.$queryRaw`
    SELECT a.pid, a.state, a.application_name, a.backend_start, a.state_change
    FROM pg_locks l JOIN pg_stat_activity a ON a.pid = l.pid
    WHERE l.locktype = 'advisory' AND l.objid = ${PRISMA_MIGRATE_LOCK} AND l.granted`;
  console.log(`Migration lock holders: ${holders.length}`);
  for (const h of holders) {
    console.log(`  pid=${h.pid} state=${h.state} app=${h.application_name || "-"} since=${h.state_change?.toISOString?.() ?? h.state_change}`);
    if (h.state !== "idle") {
      console.log("  skipped: session is not idle");
      continue;
    }
    const [{ terminated }] = await prisma.$queryRaw`SELECT pg_terminate_backend(${h.pid}::int) AS terminated`;
    console.log(`  terminated: ${terminated}`);
  }
} finally {
  await prisma.$disconnect();
}
