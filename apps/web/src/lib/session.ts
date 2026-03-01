import { auth } from '@/lib/auth'
import { db } from '@affiliatekit/db'
import { users } from '@affiliatekit/db'
import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

export type AuthUser = {
  id: string
  email: string
}

/**
 * Get the authenticated user from the session.
 * Returns null if not authenticated.
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  const session = await auth()
  if (!session?.user?.email) return null

  const dbUser = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.email, session.user.email))
    .limit(1)

  if (!dbUser[0]) return null
  return dbUser[0] as AuthUser
}

/**
 * Require authentication — returns user or a 401 NextResponse.
 */
export async function requireAuth(): Promise<AuthUser | NextResponse> {
  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return user
}
