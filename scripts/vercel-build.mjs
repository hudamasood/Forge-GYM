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

const run = (command) => {
  console.log(`\n> ${command}`);
  execSync(command, { stdio: "inherit" });
};

const environment = process.env.VERCEL_ENV ?? "local";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set for this Vercel environment. Connect the Prisma Postgres database to it in Project Settings → Environment Variables.");
  process.exit(1);
}

run("npx prisma generate");

if (environment === "production") {
  run("npx prisma migrate deploy");
  // One-off seeding from inside Vercel, where the Sensitive DATABASE_URL is available.
  // Set SEED_PRODUCTION=1 for a single deployment, then remove it. The seed is
  // create-only (never updates or deletes) and skips demo logins in production.
  if (process.env.SEED_PRODUCTION === "1") run("npx tsx prisma/seed.ts --production");
} else {
  console.log(`\nSkipping prisma migrate deploy (VERCEL_ENV=${environment}); migrations are applied by production deployments only.`);
}

run("npx next build");
