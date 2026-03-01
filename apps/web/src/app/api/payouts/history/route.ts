import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/session'
import { db } from '@affiliatekit/db'
import { payouts, affiliates, programs } from '@affiliatekit/db'
import { eq, and, desc, count, sql } from 'drizzle-orm'

const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 100

// GET /api/payouts/history — list completed payouts for the workspace
export async function GET(req: NextRequest) {
  const authResult = await requireAuth()
  if (authResult instanceof NextResponse) return authResult
  const user = authResult

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, parseInt(searchParams.get('pageSize') ?? String(DEFAULT_PAGE_SIZE)))
  )
  const offset = (page - 1) * pageSize

  try {
    const [totalRow] = await db
      .select({ total: count() })
      .from(payouts)
      .innerJoin(programs, eq(programs.id, payouts.programId))
      .where(eq(programs.userId, user.id))

    const rows = await db
      .select({
        id: payouts.id,
        affiliateEmail: affiliates.email,
        affiliateName: affiliates.name,
        programName: programs.name,
        amount: payouts.amount,
        method: payouts.method,
        status: payouts.status,
        notes: payouts.notes,
        paidAt: payouts.paidAt,
        createdAt: payouts.createdAt,
      })
      .from(payouts)
      .innerJoin(affiliates, eq(affiliates.id, payouts.affiliateId))
      .innerJoin(programs, eq(programs.id, payouts.programId))
      .where(eq(programs.userId, user.id))
      .orderBy(desc(payouts.createdAt))
      .limit(pageSize)
      .offset(offset)

    const total = totalRow?.total ?? 0

    return NextResponse.json({
      payouts: rows,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    })
  } catch (error) {
    console.error('[GET /api/payouts/history]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
