import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@affiliatekit/db'
import { programs, affiliates, clicks, conversions } from '@affiliatekit/db'
import { eq, sql, and } from 'drizzle-orm'
import { requireAuth } from '@/lib/session'
import { nanoid } from 'nanoid'

const AddAffiliateSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().max(255),
})

// GET /api/programs/:id/affiliates — list affiliates with stats
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await requireAuth()
  if (authResult instanceof NextResponse) return authResult
  const user = authResult

  // Verify program ownership
  const [program] = await db
    .select()
    .from(programs)
    .where(and(eq(programs.id, params.id), eq(programs.userId, user.id)))
    .limit(1)

  if (!program) {
    return NextResponse.json({ error: 'Program not found' }, { status: 404 })
  }

  try {
    const affiliateList = await db
      .select({
        id: affiliates.id,
        name: affiliates.name,
        email: affiliates.email,
        affiliateCode: affiliates.affiliateCode,
        status: affiliates.status,
        totalClicks: affiliates.totalClicks,
        totalConversions: affiliates.totalConversions,
        createdAt: affiliates.createdAt,
      })
      .from(affiliates)
      .where(eq(affiliates.programId, params.id))

    return NextResponse.json({ affiliates: affiliateList })
  } catch (error) {
    console.error('[GET /api/programs/:id/affiliates]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/programs/:id/affiliates — add affiliate (generate ref_code)
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await requireAuth()
  if (authResult instanceof NextResponse) return authResult
  const user = authResult

  // Verify program ownership
  const [program] = await db
    .select()
    .from(programs)
    .where(and(eq(programs.id, params.id), eq(programs.userId, user.id)))
    .limit(1)

  if (!program) {
    return NextResponse.json({ error: 'Program not found' }, { status: 404 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = AddAffiliateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation error', issues: parsed.error.issues }, { status: 400 })
  }

  const { name, email } = parsed.data

  // Check if affiliate with this email already exists in this program
  const existing = await db
    .select({ id: affiliates.id })
    .from(affiliates)
    .where(and(eq(affiliates.programId, params.id), eq(affiliates.email, email)))
    .limit(1)

  if (existing.length > 0) {
    return NextResponse.json({ error: 'Affiliate with this email already exists in this program' }, { status: 409 })
  }

  // Generate unique 8-char ref code
  let affiliateCode = nanoid(8)
  // Ensure uniqueness (retry up to 5 times)
  for (let i = 0; i < 5; i++) {
    const collision = await db
      .select({ id: affiliates.id })
      .from(affiliates)
      .where(eq(affiliates.affiliateCode, affiliateCode))
      .limit(1)
    if (collision.length === 0) break
    affiliateCode = nanoid(8)
  }

  try {
    const [affiliate] = await db
      .insert(affiliates)
      .values({
        programId: params.id,
        name,
        email,
        affiliateCode,
        status: 'active',
      })
      .returning()

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? 'https://your-site.com'
    const link = `${baseUrl}?ref=${affiliateCode}`

    return NextResponse.json({ affiliate, link }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/programs/:id/affiliates]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
