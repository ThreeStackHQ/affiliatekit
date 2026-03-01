import { NextRequest, NextResponse } from 'next/server'
import { db } from '@affiliatekit/db'
import { affiliates, conversions, programs } from '@affiliatekit/db'
import { eq, and, inArray } from 'drizzle-orm'
import { requireAuth } from '@/lib/session'

// GET /api/conversions — list conversions (filterable by status, affiliate)
export async function GET(req: NextRequest) {
  const authResult = await requireAuth()
  if (authResult instanceof NextResponse) return authResult
  const user = authResult

  const { searchParams } = new URL(req.url)
  const statusFilter = searchParams.get('status') as 'pending' | 'approved' | 'paid' | null
  const affiliateFilter = searchParams.get('affiliateId')

  // Get user's programs first to scope the conversions
  const userPrograms = await db
    .select({ id: programs.id })
    .from(programs)
    .where(eq(programs.userId, user.id))

  if (userPrograms.length === 0) {
    return NextResponse.json({ conversions: [] })
  }

  const programIds = userPrograms.map((p) => p.id)

  // Build filters
  const filters = [inArray(conversions.programId, programIds)]

  if (statusFilter && ['pending', 'approved', 'paid'].includes(statusFilter)) {
    filters.push(eq(conversions.status, statusFilter))
  }

  if (affiliateFilter) {
    filters.push(eq(conversions.affiliateId, affiliateFilter))
  }

  try {
    const results = await db
      .select({
        id: conversions.id,
        affiliateId: conversions.affiliateId,
        programId: conversions.programId,
        orderId: conversions.orderId,
        stripeCustomerId: conversions.stripeCustomerId,
        stripeChargeId: conversions.stripeChargeId,
        amountCents: conversions.amountCents,
        commissionCents: conversions.commissionCents,
        orderAmount: conversions.orderAmount,
        commissionAmount: conversions.commissionAmount,
        status: conversions.status,
        createdAt: conversions.createdAt,
        affiliateName: affiliates.name,
        affiliateEmail: affiliates.email,
        affiliateCode: affiliates.affiliateCode,
        programName: programs.name,
      })
      .from(conversions)
      .innerJoin(affiliates, eq(affiliates.id, conversions.affiliateId))
      .innerJoin(programs, eq(programs.id, conversions.programId))
      .where(and(...filters))
      .orderBy(conversions.createdAt)

    return NextResponse.json({ conversions: results })
  } catch (error) {
    console.error('[GET /api/conversions]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
