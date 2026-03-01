import NextAuth from 'next-auth'
import GitHub from 'next-auth/providers/github'
import Google from 'next-auth/providers/google'
import { db } from '@affiliatekit/db'
import { users } from '@affiliatekit/db'
import { eq } from 'drizzle-orm'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async signIn({ user, profile }) {
      if (!user.email) return false

      try {
        // Upsert user on first OAuth sign-in
        const existingUser = await db
          .select()
          .from(users)
          .where(eq(users.email, user.email))
          .limit(1)

        if (existingUser.length === 0) {
          await db.insert(users).values({
            email: user.email,
            name: user.name ?? profile?.name ?? null,
            image: user.image ?? null,
          })
        } else {
          // Update name/image if changed
          await db
            .update(users)
            .set({
              name: user.name ?? profile?.name ?? null,
              image: user.image ?? null,
            })
            .where(eq(users.email, user.email))
        }

        return true
      } catch (error) {
        console.error('[auth] signIn error:', error)
        return false
      }
    },

    async jwt({ token, user }) {
      if (user?.email) {
        token.email = user.email
      }
      return token
    },

    async session({ session, token }) {
      if (token.email && typeof token.email === 'string') {
        session.user.email = token.email

        // Fetch user ID from DB to attach to session
        try {
          const dbUser = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.email, token.email))
            .limit(1)

          if (dbUser[0]) {
            ;(session.user as typeof session.user & { id: string }).id = dbUser[0].id
          }
        } catch {
          // non-fatal
        }
      }
      return session
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },
})
