import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@affiliatekit/db'
import { programs, affiliates, conversions } from '@affiliatekit/db'
import { eq, sql } from 'drizzle-orm'
import { requireAuth } from '@/lib/session'
import { canCreateProgram } from '@/lib/tier'

const CreateProgramSchema = z.object({
  name: z.string().min(2).max(100),
  commissionType: z.enum(['percentage', 'fixed']).default('percentage'),
  commissionValue: z.number().min(0).max(100),
  cookieDays: z.number().int().min(1).max(365).default(30),
})

// GET /api/programs — list user's programs with stats
export async function GET(req: NextRequest) {
  const authResult = await requireAuth()
  if (authResult instanceof NextResponse) return authResult
  const user = authResult

  try {
    const userPrograms = await db
      .select({
        id: programs.id,
        name: programs.name,
        slug: programs.slug,
        commissionType: programs.commissionType,
        commissionValue: programs.commissionValue,
        cookieDays: programs.cookieDays,
        isActive: programs.isActive,
        createdAt: programs.createdAt,
        affiliateCount: sql<number>`cast(count(distinct ${affiliates.id}) as int)`,
      })
      .from(programs)
      .leftJoin(affiliates, eq(affiliates.programId, programs.id))
      .where(eq(programs.userId, user.id))
      .groupBy(programs.id)

    return NextResponse.json({ programs: userPrograms })
  } catch (error) {
    console.error('[GET /api/programs]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/programs — create affiliate program
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

  const parsed = CreateProgramSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation error', issues: parsed.error.issues }, { status: 400 })
  }

  const { name, commissionType, commissionValue, cookieDays } = parsed.data

  // Enforce tier limit
  const tierCheck = await canCreateProgram(user.id)
  if (!tierCheck.allowed) {
    return NextResponse.json({ error: tierCheck.reason ?? 'Program limit reached' }, { status: 403 })
  }

  // Generate a unique slug from the program name
  const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const suffix = Math.random().toString(36).slice(2, 6)
  const slug = `${baseSlug}-${suffix}`

  try {
    const [program] = await db
      .insert(programs)
      .values({
        userId: user.id,
        name,
        slug,
        commissionType,
        commissionValue: commissionValue.toString(),
        cookieDays,
        isActive: true,
      })
      .returning()

    return NextResponse.json({ program }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/programs]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
