import { db } from '@affiliatekit/db'
import { affiliates, payouts, programs } from '@affiliatekit/db'
import { eq, gt, and, inArray, sql } from 'drizzle-orm'

const DEFAULT_MINIMUM_PAYOUT = 50 // $50

export type PendingPayout = {
  affiliateId: string
  email: string
  programId: string
  programName: string
  earnedBalance: string
  paidOutBalance: string
  pendingAmount: string
}

export type MarkPaidOptions = {
  affiliateIds: string[]
  notes?: string
  method?: 'paypal' | 'bank' | 'manual'
}

/**
 * Calculate pending payouts: affiliates whose earned_balance - paid_out_balance >= minimum_payout
 */
export async function calculatePendingPayouts(
  userId: string,
  minimumPayout: number = DEFAULT_MINIMUM_PAYOUT
): Promise<PendingPayout[]> {
  const rows = await db
    .select({
      affiliateId: affiliates.id,
      email: affiliates.email,
      programId: programs.id,
      programName: programs.name,
      earnedBalance: affiliates.earnedBalance,
      paidOutBalance: affiliates.paidOutBalance,
    })
    .from(affiliates)
    .innerJoin(programs, eq(programs.id, affiliates.programId))
    .where(
      and(
        eq(programs.userId, userId),
        eq(affiliates.status, 'active'),
        gt(
          sql<string>`(${affiliates.earnedBalance} - ${affiliates.paidOutBalance})`,
          String(minimumPayout)
        )
      )
    )

  return rows.map((r) => ({
    affiliateId: r.affiliateId,
    email: r.email,
    programId: r.programId,
    programName: r.programName,
    earnedBalance: r.earnedBalance ?? '0',
    paidOutBalance: r.paidOutBalance ?? '0',
    pendingAmount: (
      parseFloat(r.earnedBalance ?? '0') - parseFloat(r.paidOutBalance ?? '0')
    ).toFixed(2),
  }))
}

/**
 * Mark affiliates as paid: create payout records and update paid_out_balance
 */
export async function markAsPaid(
  userId: string,
  options: MarkPaidOptions
): Promise<{ success: boolean; count: number }> {
  const { affiliateIds, notes, method = 'manual' } = options

  if (affiliateIds.length === 0) {
    return { success: true, count: 0 }
  }

  // Fetch affiliates (verify ownership via programs.userId)
  const rows = await db
    .select({
      affiliateId: affiliates.id,
      programId: programs.id,
      earnedBalance: affiliates.earnedBalance,
      paidOutBalance: affiliates.paidOutBalance,
    })
    .from(affiliates)
    .innerJoin(programs, eq(programs.id, affiliates.programId))
    .where(
      and(
        eq(programs.userId, userId),
        inArray(affiliates.id, affiliateIds)
      )
    )

  if (rows.length === 0) {
    return { success: true, count: 0 }
  }

  const now = new Date()

  // Create payout records and update balances for each affiliate
  for (const row of rows) {
    const pendingAmount = (
      parseFloat(row.earnedBalance ?? '0') - parseFloat(row.paidOutBalance ?? '0')
    ).toFixed(2)

    if (parseFloat(pendingAmount) <= 0) continue

    // Insert payout record
    await db.insert(payouts).values({
      programId: row.programId,
      affiliateId: row.affiliateId,
      amount: pendingAmount,
      method,
      status: 'paid',
      notes: notes ?? null,
      paidAt: now,
    })

    // Update paid_out_balance to equal earned_balance
    await db
      .update(affiliates)
      .set({ paidOutBalance: row.earnedBalance })
      .where(eq(affiliates.id, row.affiliateId))
  }

  return { success: true, count: rows.length }
}
