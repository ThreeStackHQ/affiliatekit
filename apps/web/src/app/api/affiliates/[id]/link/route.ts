import { NextRequest, NextResponse } from 'next/server'
import { db } from '@affiliatekit/db'
import { affiliates, programs } from '@affiliatekit/db'
import { eq, and } from 'drizzle-orm'
import { requireAuth } from '@/lib/session'

// GET /api/affiliates/:id/link — return affiliate's tracking link
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await requireAuth()
  if (authResult instanceof NextResponse) return authResult
  const user = authResult

  // Fetch affiliate + its program
  const [row] = await db
    .select({
      affiliateId: affiliates.id,
      affiliateCode: affiliates.affiliateCode,
      name: affiliates.name,
      email: affiliates.email,
      status: affiliates.status,
      programId: programs.id,
      programUserId: programs.userId,
      programSlug: programs.slug,
    })
    .from(affiliates)
    .innerJoin(programs, eq(programs.id, affiliates.programId))
    .where(eq(affiliates.id, params.id))
    .limit(1)

  if (!row) {
    return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 })
  }

  // Verify requester owns this program
  if (row.programUserId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? 'https://your-site.com'
  const link = `${baseUrl}?ref=${row.affiliateCode}`

  return NextResponse.json({
    affiliateId: row.affiliateId,
    name: row.name,
    email: row.email,
    status: row.status,
    affiliateCode: row.affiliateCode,
    link,
  })
}
