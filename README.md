# FORGE — Gym Platform

> Strength is made, not born.

FORGE is a premium, highly animated gym platform: a marketing site, an **object-based** membership and booking system, a full store, three role-based portals (Member / Trainer / Admin) and a signature scroll-driven 3D gym scene.

Built from the *FORGE Comprehensive Technical & Delivery Specification* (Parts A–D).

## Stack

| Concern    | Choice                                                             |
| ---------- | ------------------------------------------------------------------ |
| Framework  | Next.js 15 (App Router, TypeScript), Tailwind CSS v4               |
| Backend    | Route Handlers + Server Actions → Service layer → Repositories     |
| Database   | PostgreSQL + Prisma ORM                                            |
| Auth       | Auth.js (NextAuth v5), credentials, role-based (JWT, httpOnly)     |
| Payments   | Stripe (USD) — subscriptions + one-time Checkout, verified webhooks |
| Email      | Resend (console fallback in development)                           |
| 3D         | Three.js via React Three Fiber + GSAP ScrollTrigger                |
| Testing    | Vitest (unit + integration), Playwright + axe-core (e2e / a11y)    |
| Deployment | Vercel + Prisma Postgres                                           |

## Architecture (spec B1)

```
Presentation   src/app/**, src/components/**      React Server/Client Components
Application    src/app/api/**, **/actions.ts      zod validation, role checks, one service call
Domain         src/server/services/**             business rules — no HTTP, no Prisma
Data access    src/server/repositories/**         interfaces + Prisma and in-memory implementations
```

- A request never skips a layer. Services receive repositories and ports (`IPaymentProvider`, `INotificationChannel`, `IPasswordHasher`) through their constructors; `src/server/container.ts` is the only place concrete implementations are wired.
- Every repository interface has a Prisma implementation and an in-memory implementation used by fast, DB-free unit tests.
- Booking capacity is enforced inside a transaction holding a `SELECT … FOR UPDATE` row lock on the schedule, backed by a unique `(scheduleId, userId)` index.
- Stripe webhooks are signature-verified, normalized to provider-neutral events and processed idempotently per event id.

## Getting started

Requirements: Node 20+ and a PostgreSQL database.

```bash
npm install
cp .env.example .env.local   # app config
cp .env.example .env         # Prisma CLI reads DATABASE_URL from here
npm run db:deploy            # apply migrations
npm run db:seed              # load placeholder seed content
npm run dev
```

No local Postgres? Docker (`docker run -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:16`) or the `embedded-postgres` npm package both give you a real server. `npx prisma dev` works for quick browsing (add `&pgbouncer=true&connection_limit=1` to its TCP URL) but is single-connection and not reliable for builds or e2e runs.

Seed accounts (password `Forge123!`): `admin@forge.example`, `trainer@forge.example` (linked to coach Elena Cruz), `member@forge.example` (Yoga Unlimited).

`npm run db:seed` is safe to re-run: it matches records by slug (users by email), only creates what is missing, never updates or deletes, and tops up class sessions for the next 21 days. It refuses to touch a remote database unless you pass `--production`, and `--reset` (wipe everything first) only works locally.

## Deploying to Vercel (Prisma Postgres)

The app reads a single variable, `DATABASE_URL`, for both the runtime client and the Prisma CLI. The Vercel Prisma Postgres integration sets it (and `PRISMA_DATABASE_URL`, which the app does not use) for Production and Preview.

- **Build** — `package.json` defines `vercel-build`, so Vercel runs `scripts/vercel-build.mjs`: `prisma generate`, then `prisma migrate deploy` **on production deployments only** (previews share the production database), then `next build`. `prisma migrate dev`/`db push` are never used in deployment.
- **Seed data** — never runs automatically. The Prisma Postgres integration stores `DATABASE_URL` as a *Sensitive* variable, which `vercel env pull` cannot download, so seed from inside a production build: add `SEED_PRODUCTION=1` to the Production environment, redeploy, then remove the variable. If you have a non-sensitive copy of the connection string you can instead seed from your machine:

```bash
npx vercel link                                                   # once, pick the Forge-GYM project
npx vercel env pull .env.production.local --environment=production
npm run db:status:production                                      # compare committed migrations with production
npm run db:seed:production -- --dry-run                           # prints target host and current row counts only
npm run db:seed:production                                        # catalog: spaces, trainers, classes, sessions, plans, products
```

`.env.production.local` is git-ignored — delete it when you are done. Production seeding skips the demo logins (their password is public) unless you add `--with-demo-accounts`. Re-run `db:seed:production` to extend the class timetable, since each run schedules the next 21 days.

### Payments with Safepay (Pakistan, USD)

Set `PAYMENT_PROVIDER=safepay` to use [Safepay](https://safepay.com.pk/) instead of Stripe. Leaving it unset keeps Stripe (or the test-mode checkout in development).

| Variable | Where to find it |
| -------- | ---------------- |
| `PAYMENT_PROVIDER` | `safepay` |
| `SAFEPAY_ENVIRONMENT` | `sandbox` while testing, `production` when live |
| `SAFEPAY_API_KEY` | Safepay dashboard → Developers → API keys (public key) |
| `SAFEPAY_SECRET_KEY` | Same page (secret key) |
| `SAFEPAY_WEBHOOK_SECRET` | Developers → Endpoints → your endpoint's shared secret |

1. **Webhook:** in Developers → Endpoints add `https://<your-domain>/api/webhooks/safepay` and subscribe to `payment.succeeded`, `subscription.created`, `subscription.payment.succeeded`, `subscription.payment.failed`, `subscription.canceled` and `subscription.ended`.
2. **Membership plans:** Safepay bills subscriptions against plans created in its dashboard (Subscriptions → Plans; currency USD, amount in cents, interval MONTH or YEAR, `billing_cycles` 0). Create a monthly and an annual plan for each FORGE plan and paste the `plan_…` ids into Admin → Memberships. A plan without its Safepay id cannot be bought online.
3. **Store orders** need no dashboard setup — the amount is computed from the database at checkout.

How it maps: orders are marked paid from `payment.succeeded` (matched by `metadata.order_id`); the first subscription payment creates the membership, renewals extend `currentPeriodEnd`, failed renewals mark it past due, and cancellation/ending cancels it. Every webhook is verified with HMAC-SHA512 (`X-SFPY-SIGNATURE`) and processed once per event token. The subscription `reference` is HMAC-signed over the member, plan, interval and Safepay plan id, so swapping the plan in the checkout URL is rejected. Note: Safepay cancels subscriptions immediately, so a member who cancels loses access at once rather than at the end of the paid period. Safepay's hosted checkout does not collect a shipping address.

### Payments in development

Without `STRIPE_SECRET_KEY`, checkout uses a clearly labelled **test-mode checkout** (`/dev-checkout`) that applies the exact event the Stripe webhook would. It is never available in production unless `ENABLE_TEST_CHECKOUT=1` is set (CI only) and is always disabled when a Stripe key exists. With Stripe keys, forward webhooks locally:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## Scripts

| Script                     | What it does                                            |
| -------------------------- | ------------------------------------------------------- |
| `npm run dev`              | Start the dev server                                    |
| `npm run build` / `start`  | Production build / server                               |
| `npm run lint`             | ESLint                                                  |
| `npm run typecheck`        | TypeScript, no emit                                     |
| `npm test`                 | Unit tests (in-memory repositories)                     |
| `npm run test:coverage`    | Unit tests with the 80% service-layer coverage gate     |
| `npm run test:integration` | Service → Prisma → Postgres tests (needs `DATABASE_URL`) |
| `npm run test:e2e`         | Playwright end-to-end + axe accessibility suite         |
| `npm run db:*`             | `generate`, `migrate`, `deploy`, `seed`, `studio`, `*:production` |

CI (`.github/workflows/ci.yml`) runs lint, types, unit tests with coverage, integration tests against Postgres, then a production build with the e2e and accessibility suite.

## What's implemented

- **Public site** — Home, Classes (filters + detail with live timetable and inline booking), Trainers, Memberships (7 plans, monthly/annual, comparison, FAQ), Spaces (3D tour + 6 detail pages), Store (catalog, detail, cart, checkout), Contact.
- **Auth** — sign up, log in, password reset by email, role-based redirects, rate limiting.
- **Member portal** — overview, membership (cancel at period end), bookings (cancel), orders, profile.
- **Trainer portal** — overview, 14-day schedule, classes, weekly availability, attendance rosters, profile.
- **Admin portal** — members, memberships & plan pricing, access objects, spaces, classes, schedule (trainer/space conflict checks), trainers, bookings, products, orders, analytics; every change audited. REST: `/api/admin/{resource}[/{id}]`.
- **SEO** — SSG/ISR public pages, per-page metadata and canonicals, JSON-LD (HealthClub, Course, Person, Product/Offer, FAQPage, BreadcrumbList), `robots.txt`, `sitemap.xml` with record `lastmod`, OG image.
- **Security** — server-side role checks everywhere, zod validation, CSP/HSTS/frame headers, rate limiting, audit log, secrets only in env.

### About the 3D scene

The Spaces tour is a real-time, scroll-driven scene with all six spaces, their equipment and animated athletes (squat, run, yoga, dance, cycling and rowing via IK, boxing, kettlebell swings). The figures are **procedural stand-ins** for the specialist-rigged characters planned in the parallel 3D track (spec D3); their joint hierarchy mirrors a humanoid skeleton so GLB assets can replace them without changing the scene, camera or scroll logic. It is code-split, loads only where WebGL is available, has a low-quality tier for weaker devices, and is skipped for reduced-motion users — the readable list of spaces always renders.

## Placeholder content & open decisions

All trainers, classes, plans, products and business details (address, phone, hours) are **fabricated placeholder content** (spec A8) and must be replaced before launch. Open decisions from spec A13 that affect the code:

- Gym location/timezone → `NEXT_PUBLIC_GYM_TIMEZONE`, `src/lib/site.ts` (NAP, local SEO)
- Guest checkout (currently off), refunds, shipping/fulfilment (manual for now), waitlists, tax
- Final brand name and logo mark

Post-launch backlog (spec A14): multi-filter classes, upgrade proration, PT packages, progress tracking, QR check-in, charts, promotions, product variants, events, CMS.
