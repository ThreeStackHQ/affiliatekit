import { NextRequest, NextResponse } from 'next/server'
import { db } from '@affiliatekit/db'
import { affiliates, clicks, programs } from '@affiliatekit/db'
import { eq, and } from 'drizzle-orm'
import { checkRateLimit } from '@/lib/rate-limit'

// 1x1 transparent GIF (base64)
const TRANSPARENT_GIF = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
)

async function recordClick(
  req: NextRequest,
  refCode: string,
  trackingType: 'redirect' | 'pixel'
): Promise<{ affiliate: typeof affiliates.$inferSelect; program: typeof programs.$inferSelect } | null> {
  // Find the active affiliate by ref code
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

  if (!row) return null

  const { affiliate, program } = row

  // Rate limit: 1 click per IP per affiliate per hour
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'

  const rateLimitKey = `click:${ip}:${affiliate.id}`
  const allowed = checkRateLimit(rateLimitKey, 1, 60 * 60 * 1000) // 1 per hour

  if (allowed) {
    // Record click in DB
    await db.insert(clicks).values({
      affiliateId: affiliate.id,
      programId: program.id,
      ipAddr: ip,
      userAgent: req.headers.get('user-agent') ?? null,
      referrer: req.headers.get('referer') ?? null,
      converted: false,
      metadata: { trackingType },
    })

    // Increment counter
    await db
      .update(affiliates)
      .set({ totalClicks: affiliate.totalClicks + 1 })
      .where(eq(affiliates.id, affiliate.id))
  }

  return { affiliate, program }
}

// GET /api/track/click?ref=REFCODE&url=DESTINATION
// Records click + sets cookie + redirects
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const refCode = searchParams.get('ref')
  const destination = searchParams.get('url')

  if (!refCode) {
    return NextResponse.json({ error: 'Missing ref parameter' }, { status: 400 })
  }

  const result = await recordClick(req, refCode, 'redirect')

  // Even if affiliate not found, redirect to destination if provided
  const redirectUrl = destination && isValidUrl(destination) ? destination : '/'

  const response = NextResponse.redirect(redirectUrl, { status: 302 })

  if (result) {
    const cookieMaxAge = result.program.cookieDays * 86400
    response.cookies.set('ak_ref', refCode, {
      maxAge: cookieMaxAge,
      sameSite: 'lax',
      httpOnly: false, // needs to be readable by client JS widget
      path: '/',
    })
  }

  return response
}

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}
