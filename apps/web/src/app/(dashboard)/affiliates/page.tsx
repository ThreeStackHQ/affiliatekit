import { UserPlus, ExternalLink } from 'lucide-react'
import { db } from '@affiliatekit/db'
import { affiliates, programs } from '@affiliatekit/db'
import { eq, inArray } from 'drizzle-orm'
import { getAuthUser } from '@/lib/session'

export const dynamic = 'force-dynamic'

type AffiliateRow = {
  id: string
  name: string
  email: string
  affiliateCode: string
  status: 'pending' | 'active' | 'banned'
  totalClicks: number
  totalConversions: number
  earnedBalance: string
  paidOutBalance: string
  programName: string
  createdAt: Date
  trackingLink: string
}

async function getAffiliates(): Promise<{ affiliates: AffiliateRow[]; total: number }> {
  const user = await getAuthUser()
  if (!user) return { affiliates: [], total: 0 }

  const userPrograms = await db
    .select({ id: programs.id, name: programs.name })
    .from(programs)
    .where(eq(programs.userId, user.id))

  if (userPrograms.length === 0) return { affiliates: [], total: 0 }

  const programIds = userPrograms.map((p) => p.id)
  const programMap = new Map(userPrograms.map((p) => [p.id, p.name]))

  const affiliateList = await db
    .select()
    .from(affiliates)
    .where(inArray(affiliates.programId, programIds))
    .orderBy(affiliates.createdAt)

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? 'https://your-site.com'

  const enriched: AffiliateRow[] = affiliateList.map((a) => ({
    id: a.id,
    name: a.name,
    email: a.email,
    affiliateCode: a.affiliateCode,
    status: a.status as 'pending' | 'active' | 'banned',
    totalClicks: a.totalClicks,
    totalConversions: a.totalConversions,
    earnedBalance: a.earnedBalance ?? '0',
    paidOutBalance: a.paidOutBalance ?? '0',
    programName: programMap.get(a.programId) ?? 'Unknown Program',
    createdAt: a.createdAt,
    trackingLink: `${baseUrl}/api/track/click?ref=${a.affiliateCode}`,
  }))

  return { affiliates: enriched, total: enriched.length }
}

function statusBadge(status: string) {
  const cls: Record<string, string> = {
    active: 'bg-green-500/20 text-green-400',
    pending: 'bg-amber-500/20 text-amber-400',
    banned: 'bg-red-500/20 text-red-400',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls[status] ?? 'bg-slate-500/20 text-slate-400'}`}>
      {status}
    </span>
  )
}

export default async function AffiliatesPage() {
  const { affiliates: affiliateList, total } = await getAffiliates()

  const active = affiliateList.filter((a) => a.status === 'active').length
  const pending = affiliateList.filter((a) => a.status === 'pending').length
  const banned = affiliateList.filter((a) => a.status === 'banned').length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Affiliates</h1>
          <div className="flex gap-6 text-sm text-slate-400 mt-2">
            <span>Total: <strong className="text-white">{total}</strong></span>
            <span>Active: <strong className="text-green-400">{active}</strong></span>
            <span>Pending: <strong className="text-amber-400">{pending}</strong></span>
            {banned > 0 && <span>Banned: <strong className="text-red-400">{banned}</strong></span>}
          </div>
        </div>
      </div>

      {affiliateList.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
          <UserPlus className="h-12 w-12 text-slate-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No affiliates yet</h3>
          <p className="text-slate-400 text-sm mb-4">
            Add affiliates to your programs via the Programs page or via the affiliate self-signup API.
          </p>
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-white/10 text-slate-400">
              <tr>
                <th className="text-left px-4 py-3">Affiliate</th>
                <th className="text-left px-4 py-3">Program</th>
                <th className="text-left px-4 py-3">Joined</th>
                <th className="text-right px-4 py-3">Clicks</th>
                <th className="text-right px-4 py-3">Conversions</th>
                <th className="text-right px-4 py-3">Earned</th>
                <th className="text-center px-4 py-3">Status</th>
                <th className="px-4 py-3">Link</th>
              </tr>
            </thead>
            <tbody>
              {affiliateList.map((a) => (
                <tr key={a.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                  <td className="px-4 py-3">
                    <div className="font-medium">{a.name}</div>
                    <div className="text-xs text-slate-500">{a.email}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{a.programName}</td>
                  <td className="px-4 py-3 text-slate-400">
                    {a.createdAt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                  <td className="px-4 py-3 text-right">{a.totalClicks.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">{a.totalConversions.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-green-400">
                    ${parseFloat(a.earnedBalance).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-center">{statusBadge(a.status)}</td>
                  <td className="px-4 py-3">
                    <a
                      href={a.trackingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-green-400 transition-colors"
                      title={a.trackingLink}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-xl">
        <h3 className="text-sm font-medium mb-2 text-slate-300">Self-Signup API</h3>
        <p className="text-xs text-slate-500 mb-2">
          Affiliates can self-register via your public API. Share this endpoint:
        </p>
        <code className="text-xs bg-black/30 rounded px-2 py-1 text-green-400">
          POST /api/affiliates{' '}
          <span className="text-slate-500">{'{ programId, name, email }'}</span>
        </code>
      </div>
    </div>
  )
}
