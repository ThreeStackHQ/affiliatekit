import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/session'
import { calculatePendingPayouts } from '@/lib/payouts'

// GET /api/payouts/pending — list affiliates eligible for payout
export async function GET(req: NextRequest) {
  const authResult = await requireAuth()
  if (authResult instanceof NextResponse) return authResult
  const user = authResult

  const { searchParams } = new URL(req.url)
  const minimumPayout = parseFloat(searchParams.get('minimum') ?? '50')

  try {
    const pending = await calculatePendingPayouts(user.id, isNaN(minimumPayout) ? 50 : minimumPayout)
    return NextResponse.json({ payouts: pending, total: pending.length })
  } catch (error) {
    console.error('[GET /api/payouts/pending]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
