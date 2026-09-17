/**
 * Saves Safepay plan ids onto membership plans without the admin UI.
 *
 * SAFEPAY_PLAN_IDS="gym-floor-access-monthly=plan_…,yoga-unlimited-annual=plan_…"
 * Keys are the FORGE plan slug + "-monthly" or "-annual". Only the matching
 * safepayPlanIdMonthly/Annual column is written; nothing else changes.
 *
 * Runs from scripts/vercel-build.mjs on production deployments when
 * SAFEPAY_PLAN_IDS is set. Remove the variable afterwards so later edits in
 * Admin → Memberships are not overwritten on the next deploy.
 */
import { PrismaClient } from "@prisma/client";

const raw = process.env.SAFEPAY_PLAN_IDS ?? "";
const entries = raw
  .split(/[,\n]/)
  .map((s) => s.trim())
  .filter(Boolean);

const prisma = new PrismaClient();
let failed = false;

try {
  for (const entry of entries) {
    const match = entry.match(/^([a-z0-9-]+)-(monthly|annual)\s*=\s*(plan_[A-Za-z0-9-]+)$/);
    if (!match) {
      console.error(`  invalid entry (expected <plan-slug>-monthly|annual=plan_…): ${entry}`);
      failed = true;
      continue;
    }
    const [, slug, interval, planId] = match;
    const field = interval === "monthly" ? "safepayPlanIdMonthly" : "safepayPlanIdAnnual";
    const result = await prisma.membershipPlan.updateMany({ where: { slug }, data: { [field]: planId } });
    if (result.count === 0) {
      console.error(`  no membership plan with slug "${slug}"`);
      failed = true;
    } else {
      console.log(`  ${slug} ${interval} -> ${planId}`);
    }
  }
  const plans = await prisma.membershipPlan.findMany({ orderBy: { sortOrder: "asc" }, select: { slug: true, safepayPlanIdMonthly: true, safepayPlanIdAnnual: true } });
  const missing = plans.flatMap((p) => [!p.safepayPlanIdMonthly && `${p.slug}-monthly`, !p.safepayPlanIdAnnual && `${p.slug}-annual`].filter(Boolean));
  console.log(`Safepay plan ids still missing (${missing.length}): ${missing.join(", ") || "none"}`);
} finally {
  await prisma.$disconnect();
}

if (failed) process.exit(1);
