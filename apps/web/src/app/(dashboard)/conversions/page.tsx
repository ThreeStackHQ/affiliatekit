import { Download, ArrowRightLeft } from 'lucide-react'
import { db } from '@affiliatekit/db'
import { affiliates, conversions, programs } from '@affiliatekit/db'
import { eq, and, inArray } from 'drizzle-orm'
import { getAuthUser } from '@/lib/session'

export const dynamic = 'force-dynamic'

const statusColor: Record<string, string> = {
  pending: 'bg-amber-500/20 text-amber-400',
  approved: 'bg-blue-500/20 text-blue-400',
  paid: 'bg-green-500/20 text-green-400',
}

async function getConversions() {
  const user = await getAuthUser()
  if (!user) return { conversions: [], totals: { revenue: 0, commission: 0, pending: 0 } }

  const userPrograms = await db
    .select({ id: programs.id })
    .from(programs)
    .where(eq(programs.userId, user.id))

  if (userPrograms.length === 0) {
    return { conversions: [], totals: { revenue: 0, commission: 0, pending: 0 } }
  }

  const programIds = userPrograms.map((p) => p.id)

  const rows = await db
    .select({
      id: conversions.id,
      orderId: conversions.orderId,
      stripeCustomerId: conversions.stripeCustomerId,
      amountCents: conversions.amountCents,
      commissionCents: conversions.commissionCents,
      orderAmount: conversions.orderAmount,
      commissionAmount: conversions.commissionAmount,
      status: conversions.status,
      createdAt: conversions.createdAt,
      affiliateName: affiliates.name,
      affiliateEmail: affiliates.email,
      programName: programs.name,
    })
    .from(conversions)
    .innerJoin(affiliates, eq(affiliates.id, conversions.affiliateId))
    .innerJoin(programs, eq(programs.id, conversions.programId))
    .where(inArray(conversions.programId, programIds))
    .orderBy(conversions.createdAt)

  // Calculate summary totals
  const revenue = rows.reduce((sum, r) => sum + (r.amountCents ?? 0), 0)
  const commission = rows.reduce((sum, r) => sum + (r.commissionCents ?? 0), 0)
  const pendingCommission = rows
    .filter((r) => r.status === 'pending')
    .reduce((sum, r) => sum + (r.commissionCents ?? 0), 0)

  return {
    conversions: rows,
    totals: {
      revenue: revenue / 100,
      commission: commission / 100,
      pending: pendingCommission / 100,
    },
  }
}

export default async function ConversionsPage() {
  const { conversions: convList, totals } = await getConversions()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Conversions</h1>
          <div className="flex gap-6 mt-2 text-sm text-slate-400">
            <span>Revenue: <strong className="text-white">${totals.revenue.toFixed(2)}</strong></span>
            <span>Commissions: <strong className="text-green-400">${totals.commission.toFixed(2)}</strong></span>
            <span>Pending: <strong className="text-amber-400">${totals.pending.toFixed(2)}</strong></span>
          </div>
        </div>
      </div>

      {convList.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
          <ArrowRightLeft className="h-12 w-12 text-slate-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No conversions yet</h3>
          <p className="text-slate-400 text-sm">
            Conversions are recorded automatically when a customer completes a Stripe checkout with an affiliate ref cookie.
          </p>
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-white/10 text-slate-400">
              <tr>
                <th className="text-left px-4 py-3">Date</th>
                <th className="text-left px-4 py-3">Affiliate</th>
                <th className="text-left px-4 py-3">Program</th>
                <th className="text-left px-4 py-3">Order</th>
                <th className="text-right px-4 py-3">Amount</th>
                <th className="text-right px-4 py-3">Commission</th>
                <th className="text-center px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {convList.map((c) => (
                <tr key={c.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                  <td className="px-4 py-3 text-slate-400">
                    {new Date(c.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{c.affiliateName}</div>
                    <div className="text-xs text-slate-500">{c.affiliateEmail}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{c.programName}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs truncate max-w-[120px]" title={c.orderId}>
                    {c.orderId.slice(0, 20)}…
                  </td>
                  <td className="px-4 py-3 text-right">
                    ${(c.amountCents / 100).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right text-green-400">
                    ${(c.commissionCents / 100).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[c.status] ?? 'bg-slate-500/20 text-slate-400'}`}>
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
