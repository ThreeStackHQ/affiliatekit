import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@affiliatekit/db'
import { affiliates, clicks, conversions, programs } from '@affiliatekit/db'
import { eq, and, count } from 'drizzle-orm'
import { requireAuth } from '@/lib/session'

const UpdateAffiliateSchema = z.object({
  status: z.enum(['pending', 'active', 'banned']).optional(),
  name: z.string().min(2).max(100).optional(),
})

// Helper: verify affiliate belongs to the authenticated user's program
async function resolveAffiliate(affiliateId: string, userId: string) {
  const [row] = await db
    .select({
      affiliate: affiliates,
      program: programs,
    })
    .from(affiliates)
    .innerJoin(programs, eq(programs.id, affiliates.programId))
    .where(and(eq(affiliates.id, affiliateId), eq(programs.userId, userId)))
    .limit(1)
  return row ?? null
}

// GET /api/affiliates/:id — affiliate details + stats
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await requireAuth()
  if (authResult instanceof NextResponse) return authResult
  const user = authResult

  const row = await resolveAffiliate(params.id, user.id)
  if (!row) {
    return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 })
  }

  // Fetch click and conversion counts
  const [clickCount] = await db
    .select({ total: count() })
    .from(clicks)
    .where(eq(clicks.affiliateId, params.id))

  const [conversionCount] = await db
    .select({ total: count() })
    .from(conversions)
    .where(eq(conversions.affiliateId, params.id))

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? 'https://your-site.com'

  return NextResponse.json({
    affiliate: {
      ...row.affiliate,
      programName: row.program.name,
      commissionType: row.program.commissionType,
      commissionValue: row.program.commissionValue,
      clickCount: clickCount?.total ?? 0,
      conversionCount: conversionCount?.total ?? 0,
      trackingLink: `${baseUrl}/api/track/click?ref=${row.affiliate.affiliateCode}`,
    },
  })
}

// PATCH /api/affiliates/:id — update status or name
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await requireAuth()
  if (authResult instanceof NextResponse) return authResult
  const user = authResult

  const row = await resolveAffiliate(params.id, user.id)
  if (!row) {
    return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = UpdateAffiliateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation error', issues: parsed.error.issues }, { status: 400 })
  }

  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  try {
    const [updated] = await db
      .update(affiliates)
      .set(parsed.data)
      .where(eq(affiliates.id, params.id))
      .returning()

    return NextResponse.json({ affiliate: updated })
  } catch (error) {
    console.error('[PATCH /api/affiliates/:id]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/affiliates/:id — soft delete (set status to 'banned')
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await requireAuth()
  if (authResult instanceof NextResponse) return authResult
  const user = authResult

  const row = await resolveAffiliate(params.id, user.id)
  if (!row) {
    return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 })
  }

  try {
    await db
      .update(affiliates)
      .set({ status: 'banned' })
      .where(eq(affiliates.id, params.id))

    return NextResponse.json({ success: true, message: 'Affiliate deactivated' })
  } catch (error) {
    console.error('[DELETE /api/affiliates/:id]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
