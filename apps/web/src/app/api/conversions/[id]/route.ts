import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@affiliatekit/db'
import { conversions, programs } from '@affiliatekit/db'
import { eq, and } from 'drizzle-orm'
import { requireAuth } from '@/lib/session'

const UpdateConversionSchema = z.object({
  status: z.enum(['approved', 'paid', 'pending']),
})

// PATCH /api/conversions/:id — approve/reject conversion
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await requireAuth()
  if (authResult instanceof NextResponse) return authResult
  const user = authResult

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = UpdateConversionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation error', issues: parsed.error.issues }, { status: 400 })
  }

  // Fetch the conversion and verify ownership via program
  const [conversion] = await db
    .select({
      id: conversions.id,
      status: conversions.status,
      programId: conversions.programId,
      programUserId: programs.userId,
    })
    .from(conversions)
    .innerJoin(programs, eq(programs.id, conversions.programId))
    .where(eq(conversions.id, params.id))
    .limit(1)

  if (!conversion) {
    return NextResponse.json({ error: 'Conversion not found' }, { status: 404 })
  }

  if (conversion.programUserId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const [updated] = await db
      .update(conversions)
      .set({ status: parsed.data.status })
      .where(eq(conversions.id, params.id))
      .returning()

    return NextResponse.json({ conversion: updated })
  } catch (error) {
    console.error('[PATCH /api/conversions/:id]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/conversions/:id — get single conversion
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await requireAuth()
  if (authResult instanceof NextResponse) return authResult
  const user = authResult

  const [conversion] = await db
    .select({
      id: conversions.id,
      status: conversions.status,
      programId: conversions.programId,
      programUserId: programs.userId,
      orderId: conversions.orderId,
      stripeCustomerId: conversions.stripeCustomerId,
      stripeChargeId: conversions.stripeChargeId,
      amountCents: conversions.amountCents,
      commissionCents: conversions.commissionCents,
      orderAmount: conversions.orderAmount,
      commissionAmount: conversions.commissionAmount,
      createdAt: conversions.createdAt,
    })
    .from(conversions)
    .innerJoin(programs, eq(programs.id, conversions.programId))
    .where(eq(conversions.id, params.id))
    .limit(1)

  if (!conversion) {
    return NextResponse.json({ error: 'Conversion not found' }, { status: 404 })
  }

  if (conversion.programUserId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json({ conversion })
}
