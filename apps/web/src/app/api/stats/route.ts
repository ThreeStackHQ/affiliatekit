import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/session'
import { db } from '@affiliatekit/db'
import { affiliates, clicks, conversions, programs } from '@affiliatekit/db'
import { eq, inArray, sum, count, sql } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

// GET /api/stats — aggregate stats for dashboard header
export async function GET(req: NextRequest) {
  const authResult = await requireAuth()
  if (authResult instanceof NextResponse) return authResult
  const user = authResult

  try {
    const userPrograms = await db
      .select({ id: programs.id })
      .from(programs)
      .where(eq(programs.userId, user.id))

    if (userPrograms.length === 0) {
      return NextResponse.json({
        totalEarned: '0.00',
        totalClicks: 0,
        totalConversions: 0,
        totalAffiliates: 0,
      })
    }

    const programIds = userPrograms.map((p) => p.id)

    const [affiliateStats] = await db
      .select({
        totalAffiliates: count(),
        totalClicks: sql<number>`coalesce(sum(${affiliates.totalClicks}), 0)`,
        totalConversions: sql<number>`coalesce(sum(${affiliates.totalConversions}), 0)`,
        totalEarned: sql<string>`coalesce(sum(${affiliates.earnedBalance}), 0)`,
      })
      .from(affiliates)
      .where(inArray(affiliates.programId, programIds))

    return NextResponse.json({
      totalEarned: parseFloat(affiliateStats?.totalEarned ?? '0').toFixed(2),
      totalClicks: Number(affiliateStats?.totalClicks ?? 0),
      totalConversions: Number(affiliateStats?.totalConversions ?? 0),
      totalAffiliates: affiliateStats?.totalAffiliates ?? 0,
    })
  } catch (error) {
    console.error('[GET /api/stats]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
