import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/session'
import { calculatePendingPayouts, markAsPaid } from '@/lib/payouts'

// GET /api/payouts — list affiliates pending payout (>= $50 by default)
export async function GET(req: NextRequest) {
  const authResult = await requireAuth()
  if (authResult instanceof NextResponse) return authResult
  const user = authResult

  const { searchParams } = new URL(req.url)
  const minimum = parseFloat(searchParams.get('minimum') ?? '50')

  try {
    const pending = await calculatePendingPayouts(user.id, isNaN(minimum) ? 50 : minimum)
    return NextResponse.json({ payouts: pending, total: pending.length })
  } catch (error) {
    console.error('[GET /api/payouts]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

const MarkPaidSchema = z.object({
  affiliateIds: z.array(z.string().uuid()).min(1, 'At least one affiliate ID required'),
  notes: z.string().max(500).optional(),
  method: z.enum(['paypal', 'bank', 'manual']).optional().default('manual'),
})

// POST /api/payouts — mark affiliates as paid
export async function POST(req: NextRequest) {
  const authResult = await requireAuth()
  if (authResult instanceof NextResponse) return authResult
  const user = authResult

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = MarkPaidSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation error', issues: parsed.error.issues }, { status: 400 })
  }

  try {
    const result = await markAsPaid(user.id, parsed.data)
    return NextResponse.json({
      message: `Marked ${result.count} affiliate(s) as paid`,
      count: result.count,
    })
  } catch (error) {
    console.error('[POST /api/payouts]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
