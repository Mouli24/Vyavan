import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import {
  CreditCard, TrendingUp, DollarSign, RefreshCw,
  CheckCircle, XCircle, Clock, Search, Download,
  ArrowUpRight, ArrowDownRight, AlertCircle,
} from 'lucide-react'

const STATUS_STYLE: Record<string, string> = {
  COMPLETED: 'bg-sp-mint text-sp-success',
  PENDING:   'bg-amber-100 text-amber-700',
  HELD:      'bg-blue-100 text-blue-700',
  FAILED:    'bg-red-100 text-red-600',
}

export default function AdminPayments() {
  const [settlements, setSettlements] = useState<any[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  useEffect(() => {
    Promise.all([
      api.getSettlements(),
      api.getPaymentSummary(),
    ]).then(([s, sum]) => {
      setSettlements(s)
      setSummary(sum)
    }).catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = settlements.filter(s => {
    const matchSearch = !search || s.referenceId?.toLowerCase().includes(search.toLowerCase()) || s.recipient?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'ALL' || s.status === statusFilter
    return matchSearch && matchStatus
  })

  // Simulated platform commission (5% of total)
  const totalRevenue = settlements.reduce((acc, s) => acc + (s.amountRaw ?? 0), 0)
  const commission = totalRevenue * 0.05
  const pendingPayout = settlements.filter(s => s.status === 'PENDING' || s.status === 'HELD').reduce((acc, s) => acc + (s.amountRaw ?? 0), 0)

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-sp-text flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-sp-purple" /> Revenue & Payments
          </h1>
          <p className="text-sp-muted text-sm mt-1">Commission tracking, payouts, and reconciliation</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-sp-border rounded-xl text-sm font-medium text-sp-muted hover:text-sp-purple transition-all">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { icon: TrendingUp, label: 'Total GMV', value: `₹${(totalRevenue / 100000).toFixed(2)}L`, sub: 'Gross Merchandise Value', color: 'text-sp-purple', bg: 'bg-sp-purple-pale', trend: '+12%' },
          { icon: DollarSign, label: 'Platform Commission', value: `₹${(commission / 1000).toFixed(1)}K`, sub: '5% of GMV', color: 'text-sp-success', bg: 'bg-sp-mint', trend: '+8%' },
          { icon: Clock, label: 'Pending Payouts', value: `₹${(pendingPayout / 1000).toFixed(1)}K`, sub: 'Awaiting settlement', color: 'text-amber-600', bg: 'bg-sp-peach', trend: null },
          { icon: RefreshCw, label: 'Settlements', value: settlements.filter(s => s.status === 'COMPLETED').length, sub: 'Completed this month', color: 'text-sp-info', bg: 'bg-sp-sky', trend: null },
        ].map((card, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-sp-border-light shadow-card hover:shadow-card-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-9 h-9 ${card.bg} rounded-xl flex items-center justify-center`}>
                <card.icon className={`w-4 h-4 ${card.color}`} />
              </div>
              {card.trend && (
                <span className="flex items-center gap-0.5 text-xs font-semibold text-sp-success">
                  <ArrowUpRight className="w-3 h-3" /> {card.trend}
                </span>
              )}
            </div>
            <p className="text-2xl font-bold text-sp-text tracking-tight">{card.value}</p>
            <p className="text-sm font-medium text-sp-muted mt-0.5">{card.label}</p>
            <p className="text-xs text-sp-placeholder mt-0.5">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Commission by Category (simulated) */}
      <div className="bg-white rounded-2xl border border-sp-border-light shadow-card p-5">
        <h2 className="font-semibold text-sp-text text-sm mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-sp-purple" /> Commission by Category
        </h2>
        <div className="space-y-3">
          {[
            { cat: 'Textiles', pct: 35, amount: '₹1.2L', color: 'bg-sp-purple' },
            { cat: 'Electronics', pct: 25, amount: '₹86K', color: 'bg-sp-info' },
            { cat: 'Machinery', pct: 20, amount: '₹69K', color: 'bg-amber-400' },
            { cat: 'FMCG', pct: 12, amount: '₹41K', color: 'bg-sp-success' },
            { cat: 'Others', pct: 8, amount: '₹28K', color: 'bg-sp-muted' },
          ].map(item => (
            <div key={item.cat} className="flex items-center gap-3">
              <span className="text-sm text-sp-muted w-24">{item.cat}</span>
              <div className="flex-1 h-1.5 bg-sp-bg rounded-full overflow-hidden">
                <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.pct}%` }} />
              </div>
              <span className="text-xs font-semibold text-sp-text w-12 text-right">{item.amount}</span>
              <span className="text-xs text-sp-muted w-8 text-right">{item.pct}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Settlements Table */}
      <div className="bg-white rounded-2xl border border-sp-border-light shadow-card overflow-hidden">
        <div className="p-5 border-b border-sp-border-light flex flex-wrap items-center gap-3">
          <h2 className="font-semibold text-sp-text text-sm flex-1">Settlement History</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sp-placeholder" />
            <input
              type="text"
              placeholder="Search by ref or recipient..."
              className="pl-10 pr-4 py-2 bg-sp-bg border border-sp-border rounded-xl text-sm focus:outline-none focus:border-sp-purple w-56 transition-all"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-sp-bg border border-sp-border rounded-xl text-sm focus:outline-none focus:border-sp-purple cursor-pointer"
          >
            <option value="ALL">All Status</option>
            <option value="COMPLETED">Completed</option>
            <option value="PENDING">Pending</option>
            <option value="HELD">Held</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-sp-purple border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-sp-muted">
            <CreditCard className="w-10 h-10 mx-auto mb-3 text-sp-border" />
            <p className="font-medium text-sm">No settlements found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-sp-bg/60 border-b border-sp-border-light">
                <tr>
                  <th className="text-left py-3.5 px-5 text-[11px] font-semibold text-sp-muted uppercase tracking-wider">Reference</th>
                  <th className="text-left py-3.5 px-5 text-[11px] font-semibold text-sp-muted uppercase tracking-wider hidden md:table-cell">Recipient</th>
                  <th className="text-left py-3.5 px-5 text-[11px] font-semibold text-sp-muted uppercase tracking-wider">Amount</th>
                  <th className="text-left py-3.5 px-5 text-[11px] font-semibold text-sp-muted uppercase tracking-wider hidden lg:table-cell">Commission (5%)</th>
                  <th className="text-left py-3.5 px-5 text-[11px] font-semibold text-sp-muted uppercase tracking-wider">Status</th>
                  <th className="text-left py-3.5 px-5 text-[11px] font-semibold text-sp-muted uppercase tracking-wider hidden md:table-cell">Date</th>
                  <th className="text-right py-3.5 px-5 text-[11px] font-semibold text-sp-muted uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sp-border-light">
                {filtered.map(s => (
                  <tr key={s._id} className="hover:bg-sp-bg/40 transition-colors">
                    <td className="py-3.5 px-5">
                      <span className="font-mono text-xs font-semibold text-sp-text bg-sp-bg px-2 py-1 rounded-lg">{s.referenceId}</span>
                    </td>
                    <td className="py-3.5 px-5 hidden md:table-cell">
                      <p className="text-sm text-sp-text">{s.recipient}</p>
                    </td>
                    <td className="py-3.5 px-5">
                      <p className="text-sm font-semibold text-sp-purple">{s.amount}</p>
                    </td>
                    <td className="py-3.5 px-5 hidden lg:table-cell">
                      <p className="text-sm text-sp-success font-medium">
                        ₹{((s.amountRaw ?? 0) * 0.05).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </p>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide ${STATUS_STYLE[s.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 hidden md:table-cell">
                      <p className="text-xs text-sp-muted">{s.date}</p>
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="flex items-center justify-end gap-1.5">
                        {s.status === 'HELD' && (
                          <button className="p-1.5 text-sp-success hover:bg-sp-mint rounded-lg transition-all" title="Release payout">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {(s.status === 'COMPLETED' || s.status === 'PENDING') && (
                          <button className="p-1.5 text-sp-muted hover:text-sp-purple hover:bg-sp-purple-pale rounded-lg transition-all" title="View invoice">
                            <Download className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
