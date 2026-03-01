import { db, subscriptions } from '@affiliatekit/db'
import { eq } from 'drizzle-orm'

export type AppTier = 'free' | 'indie' | 'pro'

/**
 * Maps DB subscription tier enum values to application tier names.
 * DB enum: 'free' | 'pro' | 'business'
 * App tiers: 'free' | 'indie' | 'pro'
 */
function dbTierToAppTier(dbTier: string): AppTier {
  if (dbTier === 'business') return 'pro'
  if (dbTier === 'pro') return 'indie'
  return 'free'
}

/**
 * Maps application tier names to DB enum values.
 * Used when writing to the subscriptions table.
 */
export function appTierToDbTier(tier: AppTier): 'free' | 'pro' | 'business' {
  if (tier === 'pro') return 'business'
  if (tier === 'indie') return 'pro'
  return 'free'
}

export async function getUserTier(userId: string): Promise<AppTier> {
  try {
    const rows = await db
      .select({ tier: subscriptions.tier, status: subscriptions.status })
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1)

    const row = rows[0]
    if (!row) return 'free'

    const { tier, status } = row
    // Only honour active/trialing subscriptions
    if (status !== 'active' && status !== 'trialing') return 'free'

    return dbTierToAppTier(tier)
  } catch {
    return 'free'
  }
}

export interface TierLimits {
  programs: number
  affiliates: number
  conversions: number
}

export function getTierLimits(tier: string): TierLimits {
  if (tier === 'pro')
    return { programs: Infinity, affiliates: Infinity, conversions: Infinity }
  if (tier === 'indie')
    return { programs: 3, affiliates: 100, conversions: Infinity }
  return { programs: 1, affiliates: 10, conversions: 100 }
}
