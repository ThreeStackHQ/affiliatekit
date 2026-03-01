import { NextRequest, NextResponse } from 'next/server'
import { db } from '@affiliatekit/db'
import { affiliates, clicks, programs } from '@affiliatekit/db'
import { eq, and } from 'drizzle-orm'
import { checkRateLimit } from '@/lib/rate-limit'

// 1x1 transparent GIF bytes
const TRANSPARENT_GIF = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
)

// GET /api/track/pixel?ref=REFCODE
// Returns 1x1 transparent GIF and records impression
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const refCode = searchParams.get('ref')

  if (refCode) {
    try {
      // Find the active affiliate
      const [row] = await db
        .select({
          affiliate: affiliates,
          program: programs,
        })
        .from(affiliates)
        .innerJoin(programs, eq(programs.id, affiliates.programId))
        .where(
          and(
            eq(affiliates.affiliateCode, refCode),
            eq(affiliates.status, 'active'),
            eq(programs.isActive, true)
          )
        )
        .limit(1)

      if (row) {
        const ip =
          req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
          req.headers.get('x-real-ip') ??
          'unknown'

        // Rate limit: 1 impression per IP per affiliate per hour
        const rateLimitKey = `pixel:${ip}:${row.affiliate.id}`
        const allowed = checkRateLimit(rateLimitKey, 1, 60 * 60 * 1000)

        if (allowed) {
          await db.insert(clicks).values({
            affiliateId: row.affiliate.id,
            programId: row.program.id,
            ipAddr: ip,
            userAgent: req.headers.get('user-agent') ?? null,
            referrer: req.headers.get('referer') ?? null,
            converted: false,
            metadata: { trackingType: 'pixel' },
          })
        }
      }
    } catch (error) {
      // Pixel must always return the GIF even on error
      console.error('[GET /api/track/pixel]', error)
    }
  }

  return new NextResponse(TRANSPARENT_GIF, {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    },
  })
}
