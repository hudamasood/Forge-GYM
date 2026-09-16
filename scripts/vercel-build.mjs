/**
 * Vercel build (runs instead of `next build` because package.json defines
 * "vercel-build").
 *
 * 1. prisma generate      — never ship a stale client from Vercel's dependency cache.
 * 2. prisma migrate deploy — production deployments only. Preview deployments share
 *    the production database here, so a branch's migrations must not reach it
 *    before that branch is merged and deployed to production.
 * 3. next build
 *
 * Never `prisma migrate dev` or `db push` here: deploy only applies committed
 * migrations and never resets data.
 */
import { execSync } from "node:child_process";

const run = (command, env = process.env) => {
  console.log(`\n> ${command}`);
  execSync(command, { stdio: "inherit", env });
};

/**
 * Migrations take a session-level Postgres advisory lock, which a transaction
 * pooler can leave held after the connection is returned. Prisma Postgres's
 * pooled host (pooled.db.prisma.io) has a direct counterpart (db.prisma.io)
 * with the same credentials, so schema commands use that; the app keeps the
 * pooled URL. DIRECT_DATABASE_URL, if set, always wins.
 */
function directDatabaseUrl() {
  if (process.env.DIRECT_DATABASE_URL) return process.env.DIRECT_DATABASE_URL;
  const url = new URL(process.env.DATABASE_URL);
  if (url.hostname.startsWith("pooled.")) url.hostname = url.hostname.slice("pooled.".length);
  return url.toString();
}

const environment = process.env.VERCEL_ENV ?? "local";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set for this Vercel environment. Connect the Prisma Postgres database to it in Project Settings → Environment Variables.");
  process.exit(1);
}

run("npx prisma generate");

if (environment === "production") {
  const directEnv = { ...process.env, DATABASE_URL: directDatabaseUrl() };
  console.log(`\nSchema commands use ${new URL(directEnv.DATABASE_URL).hostname}`);
  run("npx prisma migrate deploy", directEnv);
  // One-off seeding from inside Vercel, where the Sensitive DATABASE_URL is available.
  // Set SEED_PRODUCTION=1 for a single deployment, then remove it. The seed is
  // create-only (never updates or deletes) and skips demo logins in production.
  if (process.env.SEED_PRODUCTION === "1") run("npx tsx prisma/seed.ts --production", directEnv);
} else {
  console.log(`\nSkipping prisma migrate deploy (VERCEL_ENV=${environment}); migrations are applied by production deployments only.`);
}

run("npx next build");
