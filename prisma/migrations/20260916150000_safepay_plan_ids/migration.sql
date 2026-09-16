-- Safepay plan tokens per billing interval (nullable, additive).
ALTER TABLE "MembershipPlan" ADD COLUMN "safepayPlanIdMonthly" TEXT,
ADD COLUMN "safepayPlanIdAnnual" TEXT;
