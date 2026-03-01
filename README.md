# AffiliateKit

> Affiliate marketing for indie SaaS. Like PartnerStack, but at $29/mo.

Create affiliate programs, track clicks and conversions, manage payouts — all in one clean dashboard.

## Features

- 🎯 **Affiliate Programs** — Create multiple programs with custom commission rates (% or fixed)
- 👆 **Click Tracking** — Track clicks with affiliate codes, cookie attribution
- 💰 **Conversion Tracking** — Record conversions with commission calculation
- 💳 **Payout Management** — Manage affiliate payouts in batch
- 📊 **Analytics Dashboard** — Real-time stats per program and affiliate
- 🔐 **OAuth Auth** — GitHub + Google sign-in via NextAuth v5

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript (strict)
- **Database:** PostgreSQL + Drizzle ORM
- **Auth:** NextAuth.js v5 (GitHub + Google OAuth)
- **UI:** TailwindCSS + Radix UI (dark emerald theme)
- **Monorepo:** pnpm workspaces + Turborepo

## Project Structure

```
affiliatekit/
├── apps/
│   └── web/              # Next.js 14 app
│       ├── src/
│       │   ├── app/      # App Router pages
│       │   ├── components/ui/  # Reusable UI components
│       │   └── lib/      # Auth, utilities
│       └── .env.example
├── packages/
│   ├── db/               # Drizzle ORM schema + client
│   │   ├── src/schema/   # All table definitions
│   │   └── drizzle/      # SQL migrations
│   └── config/           # Shared tsconfig + eslint
└── turbo.json
```

## Database Schema

| Table | Description |
|-------|-------------|
| `users` | Authenticated users (OAuth) |
| `programs` | Affiliate programs (commission config) |
| `affiliates` | Program affiliates with unique codes |
| `clicks` | Click events with metadata |
| `conversions` | Conversion events with commission amounts |
| `payouts` | Affiliate payout records |
| `subscriptions` | User billing tiers (free/pro/business) |

## Getting Started

```bash
# Install dependencies
pnpm install

# Set up environment
cp apps/web/.env.example apps/web/.env.local
# Fill in DATABASE_URL, AUTH_SECRET, OAuth credentials

# Run migrations
cd packages/db && pnpm db:migrate

# Start dev server
pnpm dev
```

## Pricing

| Plan | Price | Programs | Affiliates |
|------|-------|----------|-----------|
| Free | $0 | 1 | 10 |
| Pro | $29/mo | 10 | 500 |
| Business | $79/mo | Unlimited | Unlimited |

---

Built by [ThreeStack](https://threestack.io)
