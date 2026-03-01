import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@affiliatekit/db'
import { affiliates, programs } from '@affiliatekit/db'
import { eq, and, inArray } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { requireAuth } from '@/lib/session'

const SelfSignupSchema = z.object({
  programId: z.string().uuid(),
  name: z.string().min(2).max(100),
  email: z.string().email().max(255),
})

// GET /api/affiliates — list all affiliates for the authenticated user's programs (with stats)
export async function GET(req: NextRequest) {
  const authResult = await requireAuth()
  if (authResult instanceof NextResponse) return authResult
  const user = authResult

  const { searchParams } = new URL(req.url)
  const programIdFilter = searchParams.get('programId')
  const statusFilter = searchParams.get('status') as 'pending' | 'active' | 'banned' | null

  try {
    // Get user's programs
    const userPrograms = await db
      .select({ id: programs.id })
      .from(programs)
      .where(eq(programs.userId, user.id))

    if (userPrograms.length === 0) {
      return NextResponse.json({ affiliates: [], total: 0 })
    }

    const programIds = userPrograms.map((p) => p.id)

    const filters = [inArray(affiliates.programId, programIds)]

    if (programIdFilter && programIds.includes(programIdFilter)) {
      filters.push(eq(affiliates.programId, programIdFilter))
    }

    if (statusFilter && ['pending', 'active', 'banned'].includes(statusFilter)) {
      filters.push(eq(affiliates.status, statusFilter))
    }

    const affiliateList = await db
      .select({
        id: affiliates.id,
        name: affiliates.name,
        email: affiliates.email,
        affiliateCode: affiliates.affiliateCode,
        status: affiliates.status,
        totalClicks: affiliates.totalClicks,
        totalConversions: affiliates.totalConversions,
        earnedBalance: affiliates.earnedBalance,
        paidOutBalance: affiliates.paidOutBalance,
        programId: affiliates.programId,
        programName: programs.name,
        createdAt: affiliates.createdAt,
      })
      .from(affiliates)
      .innerJoin(programs, eq(programs.id, affiliates.programId))
      .where(and(...filters))
      .orderBy(affiliates.createdAt)

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? 'https://your-site.com'

    const enriched = affiliateList.map((a) => ({
      ...a,
      trackingLink: `${baseUrl}/api/track/click?ref=${a.affiliateCode}`,
    }))

    return NextResponse.json({ affiliates: enriched, total: enriched.length })
  } catch (error) {
    console.error('[GET /api/affiliates]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/affiliates — public self-signup endpoint
export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = SelfSignupSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation error', issues: parsed.error.issues }, { status: 400 })
  }

  const { programId, name, email } = parsed.data

  // Verify program exists and is active
  const [program] = await db
    .select()
    .from(programs)
    .where(and(eq(programs.id, programId), eq(programs.isActive, true)))
    .limit(1)

  if (!program) {
    return NextResponse.json({ error: 'Program not found or inactive' }, { status: 404 })
  }

  // Check for duplicate
  const existing = await db
    .select({ id: affiliates.id, affiliateCode: affiliates.affiliateCode })
    .from(affiliates)
    .where(and(eq(affiliates.programId, programId), eq(affiliates.email, email)))
    .limit(1)

  if (existing.length > 0) {
    // Return existing affiliate info (idempotent signup)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? 'https://your-site.com'
    const link = `${baseUrl}?ref=${existing[0]!.affiliateCode}`
    return NextResponse.json({
      message: 'Already registered',
      affiliateCode: existing[0]!.affiliateCode,
      link,
    })
  }

  // Generate unique 8-char ref code
  let affiliateCode = nanoid(8)
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
        programId,
        name,
        email,
        affiliateCode,
        status: 'pending', // pending approval by default for self-signup
      })
      .returning()

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? 'https://your-site.com'
    const link = `${baseUrl}?ref=${affiliateCode}`

    return NextResponse.json(
      {
        affiliate,
        link,
        message: 'Application submitted. Your affiliate link will be active once approved.',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[POST /api/affiliates]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
