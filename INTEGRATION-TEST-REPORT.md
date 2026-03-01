# AffiliateKit — Sprint 4.3 Integration Test Report

**Tester:** Sage (ThreeStack Architect Agent)  
**Date:** 2026-03-01  
**Repo:** https://github.com/ThreeStackHQ/affiliatekit  
**Commit:** 7af27f5 (`feat(billing): Stripe billing integration Sprint 3.4`)  
**Method:** Full static code analysis + build validation (no live DB/Stripe)

---

## Executive Summary

AffiliateKit's database schema and billing integration are solid foundations, but the core affiliate functionality is **entirely unimplemented**. There are no API routes for affiliate management, no click-tracking pixel, no conversion crediting via webhook, no attribution cookies, and no JS tracker. Every dashboard page renders hardcoded mock data. The app is **not deployment-ready**.

| Category | Status | Notes |
|----------|--------|-------|
| Auth (OAuth + middleware) | PARTIAL | Works but middleware routing mismatch |
| Affiliate Link Generation | FAIL | No API endpoint exists |
| Click Tracking Pixel | FAIL | Endpoint entirely missing |
| Stripe Webhook → Affiliate Credit | FAIL | Webhook only handles billing, not conversions |
| Attribution (cookie / URL param) | FAIL | Zero implementation |
| JS Tracker Snippet | FAIL | CDN URL is placeholder, no tracker.js exists |
| Affiliate Portal | FAIL | 100% hardcoded mock data |
| Dashboard | FAIL | 100% hardcoded mock data |
| Stripe Billing (checkout + portal) | PASS | Correctly implemented |
| Payout Tracking | FAIL | Schema exists, no API or UI logic |
| Security | FAIL | Multiple IDOR + unprotected routes |
| Build (TypeScript) | PARTIAL | Passes with env vars, fails without DB |

**Score: 1 PASS / 3 PARTIAL / 8 FAIL (out of 12 flows)**

---

## Test Results by Flow

---

### 1. Auth — PARTIAL

**Files:** `apps/web/src/lib/auth.ts`, `apps/web/src/middleware.ts`, `apps/web/src/app/(auth)/login/page.tsx`

#### What works:
- NextAuth v5 (Beta) with GitHub + Google OAuth providers
- JWT strategy with 30-day session lifetime
- `signIn` callback upserts user to `users` table on first login
- `session` callback fetches and attaches DB user ID
- Login page renders OAuth buttons correctly
- Logged-in users are redirected away from `/login`

#### Bugs:

**[BUG-001] P0-CRITICAL — Middleware routing mismatch: dashboard sub-pages are unprotected**

The middleware protects `/dashboard/:path*`, but the actual Next.js routes from the `(dashboard)` route group resolve to `/affiliates`, `/billing`, `/conversions`, `/payouts`, and `/settings` — NOT `/dashboard/affiliates` etc.

Evidence from `next build` output:
```
/affiliates     → apps/web/src/app/(dashboard)/affiliates/page.tsx
/billing        → apps/web/src/app/(dashboard)/billing/page.tsx
/conversions    → apps/web/src/app/(dashboard)/conversions/page.tsx
/payouts        → apps/web/src/app/(dashboard)/payouts/page.tsx
/settings       → apps/web/src/app/(dashboard)/settings/page.tsx
```

The middleware config:
```typescript
matcher: ['/dashboard/:path*', '/login']
```

This means all pages except `/dashboard` (Programs stub) are publicly accessible without authentication.

**[BUG-002] HIGH — Navigation links are broken (404s)**

`(dashboard)/layout.tsx` nav links to `/dashboard/affiliates`, `/dashboard/conversions`, `/dashboard/payouts`, `/dashboard/billing`, `/dashboard/settings` — none of these routes exist. Clicking any nav item except "Programs" results in a 404.

```typescript
// From (dashboard)/layout.tsx
const nav = [
  { href: '/dashboard/affiliates', label: 'Affiliates', icon: Users },
  { href: '/dashboard/conversions', label: 'Conversions', icon: ArrowRightLeft },
  // ...
]
```

**Fix needed:** Either move all page files under `app/dashboard/` or update middleware matcher and nav hrefs to match the `(dashboard)` group routes at root level.

---

### 2. Affiliate Link Generation — FAIL

**Expected:** `POST /api/affiliates` creates affiliate with unique tracking code

**Reality:** No API route for affiliates exists. The entire `apps/web/src/app/api/` directory contains only Stripe routes.

The affiliates page "Send Invite" button just clears the input field — no network request:
```typescript
// affiliates/page.tsx
<button onClick={() => setInviteEmail('')}>Send Invite</button>
```

**[BUG-003] P0-CRITICAL — No affiliate CRUD API**  
Missing:
- `POST /api/affiliates` — create affiliate + generate unique code
- `GET /api/affiliates` — list affiliates for a program
- `PATCH /api/affiliates/[id]` — approve/reject/ban affiliate
- `DELETE /api/affiliates/[id]` — remove affiliate

The "Approve" and "Reject" buttons on pending affiliates also have no handlers.

---

### 3. Click Tracking Pixel — FAIL

**Expected:** `GET /pixel/:code` or `GET /api/track/:code` records a click, sets attribution cookie, redirects to target URL

**Reality:** No such endpoint exists anywhere in the codebase. The `clicks` table schema exists with the right columns, but there is no route to insert records into it.

**[BUG-004] P0-CRITICAL — Click tracking endpoint entirely missing**  
The entire attribution pipeline starts here. Without this, zero click data is recorded.

---

### 4. Stripe Webhook Conversion Handler — FAIL

**File:** `apps/web/src/app/api/stripe/webhook/route.ts`

The webhook handler only processes billing events:
- `checkout.session.completed` → upserts `subscriptions` record
- `customer.subscription.updated` → updates subscription tier
- `customer.subscription.deleted` → cancels subscription

**[BUG-005] P0-CRITICAL — Webhook does NOT credit affiliates on conversion**

When a customer pays (generating a `checkout.session.completed` or `payment_intent.succeeded` event), the handler:
1. Does NOT look up an affiliate cookie/attribution from session metadata
2. Does NOT insert a `conversions` record
3. Does NOT calculate or store a commission amount
4. Does NOT update `affiliates.total_conversions`

The full attribution chain `Stripe payment → conversion record → affiliate commission` is completely absent.

```typescript
// webhook/route.ts — checkout.session.completed handler
// Only does subscription management, zero affiliate crediting:
await db.insert(subscriptions).values({
  userId,
  tier: dbTier,
  status: 'active',
  // ...
})
// No: conversions insert, no: affiliate commission calculation
```

---

### 5. Attribution (Cookie / URL Param Tracking) — FAIL

**Expected:** When a user visits via `?ref=CODE`, a cookie is set and the affiliate code is stored for multi-touch attribution across the conversion funnel.

**Reality:** Zero attribution logic exists anywhere in the codebase. No middleware reading `?ref=` params, no cookie setting, no session storage of attribution.

**[BUG-006] P0-CRITICAL — Attribution system entirely unimplemented**

The `cookieDays` field exists in the `programs` schema and a UI input exists in program settings, but the value is never read or used at runtime.

---

### 6. JS Tracker Snippet — FAIL

**File:** `apps/web/src/app/(dashboard)/programs/[id]/settings/page.tsx`

The program settings page shows an embeddable snippet:
```html
<script src="https://cdn.affiliatekit.io/tracker.js"
  data-program="prog_abc123"
  data-commission="20%">
</script>
```

**[BUG-007] P0-CRITICAL — tracker.js does not exist**

- No `cdn.affiliatekit.io` CDN is configured
- No `tracker.js` file exists in the codebase
- The snippet is a static visual placeholder
- The program ID in the snippet is hardcoded as `prog_abc123` instead of the real dynamic program ID
- Commission value reads from local React state (never saved to DB)

**[BUG-008] HIGH — Program settings "Save Settings" button does nothing**

The save button has no API call:
```typescript
<button className="...">Save Settings</button>
// No onClick handler, no form submission, no API call
```

---

### 7. Affiliate Portal — FAIL

**File:** `apps/web/src/app/portal/[programId]/[affiliateId]/page.tsx`

**[BUG-009] P0-CRITICAL — Entire portal is hardcoded mock data**

```typescript
const referralLink = 'https://app.threestack.io?ref=sarah_abc123'  // hardcoded
// Stats: Clicks=847, Conversions=23, Earned=$1,242, Pending=$198 — all hardcoded
```

The `[programId]` and `[affiliateId]` route params are never read. The same static page renders regardless of which affiliate views it.

**[BUG-010] P0-CRITICAL — Portal has zero authentication**

Any unauthenticated visitor can access `/portal/{any-uuid}/{any-uuid}` and see the page. No auth check, no token verification.

**[BUG-011] HIGH — Marketing assets "Download" buttons are non-functional**

No asset URLs exist; buttons have no handlers.

---

### 8. Dashboard — FAIL

**Files:** All `apps/web/src/app/(dashboard)/` pages

All dashboard pages use hardcoded data:

**Affiliates page:**
```typescript
const mockAffiliates = [
  { id: '1', name: 'Sarah Chen', email: 's***@example.com', ... },
  // 5 fake affiliates hardcoded
]
```

**Conversions page:**
```typescript
const convs = [
  { date: '2026-03-01', affiliate: 'Sarah Chen', ... },
  // 5 fake conversions hardcoded
]
```

**Dashboard layout header:**
```typescript
// Hardcoded forever:
<span>Total Earned: <strong className="text-green-400">$4,821</strong></span>
<span>Clicks: <strong className="text-white">3,247</strong></span>
<span>Conversions: <strong className="text-green-400">89</strong></span>
```

**Main Programs page:** Stub — "Manage your affiliate programs and track performance." — no program list, no create button, no API call.

**Payouts page:** Stub — "Manage affiliate payouts." — no data, no functionality.

**Settings page:** Stub — "Configure your AffiliateKit account." — no data, no functionality.

**[BUG-012] P0-CRITICAL — Dashboard uses 100% mock data, no DB reads**

---

### 9. Stripe Billing — PASS

**Files:** `api/stripe/checkout/route.ts`, `api/stripe/portal/route.ts`, `api/stripe/webhook/route.ts`, `lib/stripe.ts`

This is the only flow that is genuinely implemented:
- Checkout session creation is correct (auth-gated, uses userId metadata)
- Stripe Customer Portal redirect works correctly
- Webhook handles subscription lifecycle: created → updated → deleted
- Webhook is properly signature-verified

Minor issue: Billing page shows `MOCK_PLAN = 'indie'` instead of reading the real subscription from DB.

**[BUG-013] MEDIUM — Billing page reads mock data, not real subscription**

```typescript
const MOCK_PLAN = 'indie' as 'free' | 'indie' | 'pro'
const MOCK_RENEWAL = 'April 1, 2026'
const MOCK_USAGE = { programs: { used: 2, limit: 3 }, ... }
```

The `getUserTier()` function and `getTierLimits()` exist in `lib/tier.ts` but are never called in the billing page.

---

### 10. Payout Tracking — FAIL

**Schema:** `packages/db/src/schema/payouts.ts`

The `payouts` table is well-designed with `pending | processing | paid` status enum and `paidAt` timestamp. However:

**[BUG-014] P0-CRITICAL — Zero payout functionality implemented**

- No `POST /api/payouts` to create payout records
- No `PATCH /api/payouts/[id]` to update payout status
- No batch payout processing
- The payouts dashboard page is a blank stub
- No automated payout creation when commissions accumulate

---

### 11. Security — FAIL

**[BUG-015] P0-CRITICAL — IDOR: Affiliate portal leaks all affiliate data**

`/portal/[programId]/[affiliateId]` accepts any UUID combination with no authorization check. An attacker could enumerate affiliate IDs (or guess program IDs via brute force) and see any affiliate's data.

Currently the page is mock data, but once real data is wired up this is an IDOR vulnerability.

**[BUG-016] P0-CRITICAL — Middleware doesn't protect most dashboard routes**

See BUG-001. Routes `/affiliates`, `/billing`, `/conversions`, `/payouts`, `/settings` are publicly accessible.

**[BUG-017] MEDIUM — No CORS configuration**

No CORS headers are set anywhere in the codebase. The tracking pixel endpoint (once implemented) needs CORS `*` for cross-origin image requests. API endpoints should have appropriate CORS restrictions.

**[BUG-018] LOW — Dashboard layout leaks user email as static "user@example.com"**

```typescript
// (dashboard)/layout.tsx
<p className="text-sm font-medium truncate">user@example.com</p>
```

The logged-in user's email is never fetched from the session; a placeholder is shown.

---

### 12. Build — PARTIAL

**With env vars set:** Build succeeds cleanly. TypeScript compilation passes. All 12 routes build successfully. No type errors.

**Without DATABASE_URL:** Build fails at "Collecting page data" phase when Next.js tries to evaluate the NextAuth route. This is expected behavior for a DB-dependent app but means CI pipelines need env var mocking.

---

## Tier Mapping Bug

**[BUG-019] MEDIUM — DB tier enum mismatches README pricing**

`subscriptions.tier` DB enum: `free | pro | business`  
App tiers: `free | indie | pro`  
README pricing: Free / Pro($29) / Business($79)  
Billing page pricing: Free / Indie($9) / Pro($29)

The mapping in `lib/tier.ts`:
```typescript
// DB 'pro' → App 'indie' ($9/mo plan)
// DB 'business' → App 'pro' ($29/mo plan)
```

This mapping is internally consistent, but the README and the actual DB enum names don't agree. New devs will be confused. The README pricing ($29 Pro, $79 Business) also contradicts the billing page ($9 Indie, $29 Pro).

**[BUG-020] MEDIUM — Plan limits never enforced**

`getTierLimits()` in `lib/tier.ts` correctly defines per-tier limits, but is never imported or called anywhere outside of `tier.ts` itself. No program creation, affiliate invite, or conversion recording endpoint checks limits (because none of those endpoints exist yet).

---

## Summary Bug Table

| ID | Severity | Flow | Description |
|----|----------|------|-------------|
| BUG-001 | P0-CRITICAL | Auth | Middleware mismatch — most dashboard routes unprotected |
| BUG-002 | HIGH | Auth | Nav links are 404s — hrefs don't match route structure |
| BUG-003 | P0-CRITICAL | Affiliate Mgmt | No affiliate CRUD API endpoints |
| BUG-004 | P0-CRITICAL | Click Tracking | No pixel/click tracking endpoint |
| BUG-005 | P0-CRITICAL | Stripe Webhook | Webhook doesn't credit affiliates on conversion |
| BUG-006 | P0-CRITICAL | Attribution | Cookie/URL param attribution entirely unimplemented |
| BUG-007 | P0-CRITICAL | JS Snippet | tracker.js doesn't exist; snippet is placeholder |
| BUG-008 | HIGH | JS Snippet | Program settings Save button has no handler |
| BUG-009 | P0-CRITICAL | Portal | Portal shows hardcoded data, ignores route params |
| BUG-010 | P0-CRITICAL | Portal | Zero auth on affiliate portal — fully public |
| BUG-011 | HIGH | Portal | Download buttons are non-functional |
| BUG-012 | P0-CRITICAL | Dashboard | All dashboard pages use hardcoded mock data |
| BUG-013 | MEDIUM | Billing | Billing page uses MOCK_PLAN instead of real DB data |
| BUG-014 | P0-CRITICAL | Payouts | Zero payout functionality implemented |
| BUG-015 | P0-CRITICAL | Security | IDOR on affiliate portal |
| BUG-016 | P0-CRITICAL | Security | Most dashboard routes publicly accessible |
| BUG-017 | MEDIUM | Security | No CORS configuration |
| BUG-018 | LOW | UI | Layout shows "user@example.com" placeholder |
| BUG-019 | MEDIUM | Billing | Tier naming mismatch (DB vs README vs UI) |
| BUG-020 | MEDIUM | Billing | Plan limits exist in code but never enforced |

**Total: 11 P0-CRITICAL, 4 HIGH, 4 MEDIUM, 1 LOW**

---

## What Works

1. **Database schema** — All tables correctly defined with proper relations, indexes, and enum types
2. **Drizzle ORM setup** — Client configuration and schema exports are correct
3. **NextAuth v5 OAuth** — GitHub + Google login flow + user upsert works
4. **Stripe billing trio** — Checkout, portal redirect, and webhook lifecycle all correctly implemented
5. **TypeScript compilation** — Zero type errors, strict mode passes
6. **UI/UX design** — Clean dark theme, responsive layout, good component structure

---

## What Needs Bolt Fixes (Prioritized)

### Sprint 4.4 — Core Backend (P0 blockers)

1. **Fix middleware + routing** — Either restructure files to `app/dashboard/` or update middleware matcher to cover actual routes
2. **`POST /api/programs`** — Program creation with tier limit enforcement
3. **`POST /api/affiliates`** — Invite affiliate, generate unique `affiliateCode`, send invite email
4. **`GET /api/affiliates`** — List affiliates for authenticated user's programs
5. **`PATCH /api/affiliates/[id]`** — Approve / reject / ban affiliate
6. **`GET /api/track/:code`** — Click pixel: record click to `clicks` table, set attribution cookie, redirect
7. **Wire attribution in Stripe webhook** — Read `affiliateCode` from checkout session metadata, create `conversions` record, update `affiliates.total_conversions`
8. **Affiliate portal auth** — Token-based or magic-link auth before showing portal data
9. **Wire portal to real DB** — Query actual clicks/conversions/earnings for `affiliateId`

### Sprint 4.5 — Data & Enforcement

10. **Wire dashboard to DB** — Replace all mock arrays with real DB queries via server components
11. **Wire billing page to real subscription** — Call `getUserTier()` instead of `MOCK_PLAN`
12. **Enforce plan limits** — Call `getTierLimits()` in affiliate invite and program creation routes
13. **Build tracker.js** — Vanilla JS script that reads `?ref=CODE`, sets cookie, and optionally fires conversion pixel

### Sprint 4.6 — Payout & Polish

14. **Payout management API** — Create and update payout records
15. **Batch payout processing** — Mark approved conversions as paid in bulk
16. **CORS headers** — Add appropriate CORS to pixel and public API routes
17. **Fix README pricing** — Align Free/Indie/Pro naming across README, DB enum, and UI

---

## Deployment Readiness

**❌ NOT DEPLOYMENT READY**

The product has a functional billing system and correct database schema, but the core affiliate tracking product is not implemented. Shipping now would result in:
- Users signing up and being unable to create programs or invite affiliates
- No click or conversion tracking occurring
- All dashboard stats showing fake data
- Affiliate portals showing Sarah Chen's hardcoded stats to everyone

Recommend not launching until at minimum Sprint 4.4 P0 items are complete.
