import { NextRequest, NextResponse } from 'next/server'
import { db } from '@affiliatekit/db'
import { affiliates, clicks, programs } from '@affiliatekit/db'
import { eq, and } from 'drizzle-orm'
import { checkRateLimit } from '@/lib/rate-limit'

const FALLBACK_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://your-site.com'

// GET /api/pixel/:code — click tracking redirect
// 1. Find affiliate by code
// 2. Record click
// 3. Set aff_ref cookie (30 days)
// 4. 302 redirect to program's target URL (or app root)
export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const { code } = params

  if (!code) {
    return NextResponse.redirect(FALLBACK_URL, { status: 302 })
  }

  // Optional destination override via query param (e.g. ?url=https://...)
  const { searchParams } = new URL(req.url)
  const destinationOverride = searchParams.get('url')

  try {
    // Find affiliate by code (must be active, program must be active)
    const [row] = await db
      .select({
        affiliate: affiliates,
        program: programs,
      })
      .from(affiliates)
      .innerJoin(programs, eq(programs.id, affiliates.programId))
      .where(
        and(
          eq(affiliates.affiliateCode, code),
          eq(affiliates.status, 'active'),
          eq(programs.isActive, true)
        )
      )
      .limit(1)

    // Determine redirect URL
    let targetUrl = FALLBACK_URL
    if (destinationOverride && isValidUrl(destinationOverride)) {
      targetUrl = destinationOverride
    } else if (row) {
      // Use app URL as the default landing destination
      targetUrl = process.env.NEXT_PUBLIC_APP_URL ?? FALLBACK_URL
    }

    if (!row) {
      // Affiliate not found — still redirect, just don't record click
      return NextResponse.redirect(targetUrl, { status: 302 })
    }

    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      req.headers.get('x-real-ip') ??
      'unknown'

    // Rate limit: 1 click per IP per affiliate per hour
    const rateLimitKey = `pixel_redirect:${ip}:${row.affiliate.id}`
    const allowed = checkRateLimit(rateLimitKey, 1, 60 * 60 * 1000)

    if (allowed) {
      // Record click
      await db.insert(clicks).values({
        affiliateId: row.affiliate.id,
        programId: row.program.id,
        ipAddr: ip,
        userAgent: req.headers.get('user-agent') ?? null,
        referrer: req.headers.get('referer') ?? null,
        converted: false,
        metadata: { trackingType: 'pixel_redirect' },
      })

      // Increment click counter on affiliate
      await db
        .update(affiliates)
        .set({ totalClicks: row.affiliate.totalClicks + 1 })
        .where(eq(affiliates.id, row.affiliate.id))
    }

    // Set cookie expiry based on program's cookieDays setting
    const cookieMaxAge = row.program.cookieDays * 86400

    const response = NextResponse.redirect(targetUrl, { status: 302 })
    response.cookies.set('aff_ref', code, {
      maxAge: cookieMaxAge,
      sameSite: 'lax',
      httpOnly: false,
      path: '/',
    })
    // Also set ak_ref for backward compat with existing tracking
    response.cookies.set('ak_ref', code, {
      maxAge: cookieMaxAge,
      sameSite: 'lax',
      httpOnly: false,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('[GET /api/pixel/:code]', error)
    // Always redirect even on error
    return NextResponse.redirect(FALLBACK_URL, { status: 302 })
  }
}

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}
