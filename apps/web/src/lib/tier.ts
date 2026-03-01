import { db } from '@affiliatekit/db'
import { subscriptions, programs, affiliates } from '@affiliatekit/db'
import { eq, count } from 'drizzle-orm'

export type Tier = 'free' | 'indie' | 'pro'

const TIER_LIMITS = {
  free: {
    programLimit: 1,
    affiliateLimit: 10,
    conversionsPerMonth: 100,
  },
  indie: {
    programLimit: 3,
    affiliateLimit: 100,
    conversionsPerMonth: Infinity,
  },
  pro: {
    programLimit: Infinity,
    affiliateLimit: Infinity,
    conversionsPerMonth: Infinity,
  },
} as const

/**
 * Get the current tier for a user (checks subscription status)
 */
export async function getUserTier(userId: string): Promise<Tier> {
  const [sub] = await db
    .select({
      tier: subscriptions.tier,
      status: subscriptions.status,
      currentPeriodEnd: subscriptions.currentPeriodEnd,
    })
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1)

  if (!sub) return 'free'

  // Verify subscription is active and not expired
  const isActive =
    sub.status === 'active' &&
    (!sub.currentPeriodEnd || sub.currentPeriodEnd > new Date())

  if (!isActive) return 'free'

  return (sub.tier as Tier) ?? 'free'
}

/**
 * Check if user can create another program based on their tier
 */
export async function canCreateProgram(userId: string): Promise<{ allowed: boolean; reason?: string }> {
  const tier = await getUserTier(userId)
  const limit = TIER_LIMITS[tier].programLimit

  if (limit === Infinity) return { allowed: true }

  const [row] = await db
    .select({ total: count() })
    .from(programs)
    .where(eq(programs.userId, userId))

  const current = row?.total ?? 0

  if (current >= limit) {
    return {
      allowed: false,
      reason: `Your ${tier} plan allows up to ${limit} program(s). Upgrade to create more.`,
    }
  }

  return { allowed: true }
}

/**
 * Get affiliate limit for a user's tier
 */
export function getAffiliateLimit(tier: Tier): number {
  const limit = TIER_LIMITS[tier].affiliateLimit
  return limit === Infinity ? -1 : limit // -1 means unlimited
}

/**
 * Check if user can add another affiliate to a program
 */
export async function canAddAffiliate(
  userId: string,
  programId: string
): Promise<{ allowed: boolean; reason?: string }> {
  const tier = await getUserTier(userId)
  const limit = TIER_LIMITS[tier].affiliateLimit

  if (limit === Infinity) return { allowed: true }

  const [row] = await db
    .select({ total: count() })
    .from(affiliates)
    .where(eq(affiliates.programId, programId))

  const current = row?.total ?? 0

  if (current >= limit) {
    return {
      allowed: false,
      reason: `Your ${tier} plan allows up to ${limit} affiliate(s) per program. Upgrade to add more.`,
    }
  }

  return { allowed: true }
}
