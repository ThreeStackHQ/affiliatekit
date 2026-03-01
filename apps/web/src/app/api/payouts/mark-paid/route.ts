import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/session'
import { markAsPaid } from '@/lib/payouts'

const MarkPaidSchema = z.object({
  affiliateIds: z.array(z.string().uuid()).min(1, 'At least one affiliate ID is required'),
  notes: z.string().max(500).optional(),
  method: z.enum(['paypal', 'bank', 'manual']).optional().default('manual'),
})

// POST /api/payouts/mark-paid — mark affiliates as paid
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

  const { affiliateIds, notes, method } = parsed.data

  try {
    const result = await markAsPaid(user.id, { affiliateIds, notes, method })
    return NextResponse.json({
      message: `Successfully marked ${result.count} affiliate(s) as paid`,
      count: result.count,
    })
  } catch (error) {
    console.error('[POST /api/payouts/mark-paid]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
