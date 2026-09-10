# FORGE — Gym Platform

> Strength is made, not born.

FORGE is a premium, highly animated gym platform: a marketing site, an **object-based** membership and booking system, a full store, three role-based portals (Member / Trainer / Admin) and a signature scroll-driven 3D gym scene.

Built from the *FORGE Comprehensive Technical & Delivery Specification*.

## Stack

| Concern    | Choice                                                         |
| ---------- | -------------------------------------------------------------- |
| Framework  | Next.js 15 (App Router, TypeScript), Tailwind CSS v4           |
| Backend    | Route Handlers + Server Actions → Service layer → Repositories |
| Database   | PostgreSQL + Prisma ORM                                        |
| Auth       | Auth.js (NextAuth v5), credentials, role-based                 |
| Payments   | Stripe (USD) — subscriptions + one-time checkout               |
| Email      | Resend                                                         |
| 3D         | Three.js via React Three Fiber + GSAP ScrollTrigger            |
| Testing    | Vitest (unit/integration), Playwright + axe-core (e2e/a11y)    |
| Deployment | Vercel                                                         |

## Getting started

```bash
npm install
cp .env.example .env.local   # and a copy as .env for the Prisma CLI
npm run db:migrate           # create the schema
npm run db:seed              # load placeholder seed content
npm run dev
```

Placeholder seed accounts (password `Forge123!`): `admin@forge.example`, `trainer@forge.example`, `member@forge.example`.

## Scripts

| Script                     | What it does                          |
| -------------------------- | ------------------------------------- |
| `npm run dev`              | Start the dev server                  |
| `npm run build`            | Production build                      |
| `npm run lint`             | ESLint                                |
| `npm run typecheck`        | TypeScript, no emit                   |
| `npm test`                 | Unit tests (in-memory repositories)   |
| `npm run test:integration` | Route/repository tests vs. a test DB  |
| `npm run test:e2e`         | Playwright end-to-end + accessibility |

## Seed content

All trainers, classes, plans and products are **fabricated placeholder content** (spec A8) and must be replaced with real business data before launch.
