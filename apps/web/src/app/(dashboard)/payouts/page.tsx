import { DollarSign } from 'lucide-react'
import { db } from '@affiliatekit/db'
import { affiliates, payouts, programs } from '@affiliatekit/db'
import { eq, desc } from 'drizzle-orm'
import { getAuthUser } from '@/lib/session'
import { calculatePendingPayouts } from '@/lib/payouts'

export const dynamic = 'force-dynamic'

const statusColor: Record<string, string> = {
  pending: 'bg-amber-500/20 text-amber-400',
  processing: 'bg-blue-500/20 text-blue-400',
  paid: 'bg-green-500/20 text-green-400',
}

async function getData() {
  const user = await getAuthUser()
  if (!user) return { pending: [], history: [] }

  const [pending, historyRows] = await Promise.all([
    calculatePendingPayouts(user.id),
    db
      .select({
        id: payouts.id,
        affiliateName: affiliates.name,
        affiliateEmail: affiliates.email,
        programName: programs.name,
        amount: payouts.amount,
        method: payouts.method,
        status: payouts.status,
        notes: payouts.notes,
        paidAt: payouts.paidAt,
        createdAt: payouts.createdAt,
      })
      .from(payouts)
      .innerJoin(affiliates, eq(affiliates.id, payouts.affiliateId))
      .innerJoin(programs, eq(programs.id, payouts.programId))
      .where(eq(programs.userId, user.id))
      .orderBy(desc(payouts.createdAt))
      .limit(50),
  ])

  return { pending, history: historyRows }
}

export default async function PayoutsPage() {
  const { pending, history } = await getData()

  const totalPendingAmount = pending
    .reduce((sum, p) => sum + parseFloat(p.pendingAmount), 0)
    .toFixed(2)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1">Payouts</h1>
        <p className="text-slate-400 text-sm">Manage affiliate commission payouts.</p>
      </div>

      {/* Pending Payouts */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Pending Payouts</h2>
            <p className="text-sm text-slate-400">
              {pending.length} affiliate{pending.length !== 1 ? 's' : ''} eligible · ${totalPendingAmount} total
            </p>
          </div>
        </div>

        {pending.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
            <DollarSign className="h-10 w-10 text-slate-500 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">No affiliates have reached the $50 payout threshold yet.</p>
          </div>
        ) : (
          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-white/10 text-slate-400">
                <tr>
                  <th className="text-left px-4 py-3">Affiliate</th>
                  <th className="text-left px-4 py-3">Program</th>
                  <th className="text-right px-4 py-3">Earned</th>
                  <th className="text-right px-4 py-3">Paid Out</th>
                  <th className="text-right px-4 py-3">Due</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {pending.map((p) => (
                  <tr key={p.affiliateId} className="border-b border-white/5 hover:bg-white/[0.03]">
                    <td className="px-4 py-3">
                      <div className="font-medium">{p.email}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{p.programName}</td>
                    <td className="px-4 py-3 text-right">${parseFloat(p.earnedBalance).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-slate-400">
                      ${parseFloat(p.paidOutBalance).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right text-green-400 font-semibold">
                      ${parseFloat(p.pendingAmount).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <form
                        action={`/api/payouts/mark-paid`}
                        method="POST"
                        className="inline"
                      >
                        <input type="hidden" name="affiliateIds" value={p.affiliateId} />
                        <button
                          type="submit"
                          className="text-xs bg-green-500/20 text-green-400 hover:bg-green-500/30 px-3 py-1.5 rounded font-medium transition-colors"
                        >
                          Mark Paid
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Payout History */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Payout History</h2>
        {history.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
            <p className="text-slate-400 text-sm">No payouts have been made yet.</p>
          </div>
        ) : (
          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-white/10 text-slate-400">
                <tr>
                  <th className="text-left px-4 py-3">Affiliate</th>
                  <th className="text-left px-4 py-3">Program</th>
                  <th className="text-left px-4 py-3">Method</th>
                  <th className="text-right px-4 py-3">Amount</th>
                  <th className="text-center px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Paid At</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                    <td className="px-4 py-3">
                      <div className="font-medium">{h.affiliateName}</div>
                      <div className="text-xs text-slate-500">{h.affiliateEmail}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{h.programName}</td>
                    <td className="px-4 py-3 text-slate-400 capitalize">{h.method}</td>
                    <td className="px-4 py-3 text-right text-green-400 font-medium">
                      ${parseFloat(h.amount).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[h.status] ?? 'bg-slate-500/20 text-slate-400'}`}
                      >
                        {h.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {h.paidAt
                        ? new Date(h.paidAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
