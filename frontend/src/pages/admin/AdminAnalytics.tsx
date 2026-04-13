import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { BarChart2, TrendingUp, Users, Package, DollarSign, Factory } from 'lucide-react'

export default function AdminAnalytics() {
  const [data, setData] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.getAdminStats(), api.getAdminAnalytics()])
      .then(([s, a]) => { setStats(s); setData(a) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-sp-purple border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-5 sm:p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-sp-text tracking-tight">Analytics</h1>
        <p className="text-sp-muted text-sm mt-0.5">Platform performance metrics and trends</p>
      </div>

      {/* 30-day highlights */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { icon: Factory, label: 'New Manufacturers (30d)', value: data?.newManufacturers30 ?? 0, color: 'text-sp-purple', bg: 'bg-sp-purple-pale' },
          { icon: Users,   label: 'New Buyers (30d)',        value: data?.newBuyers30 ?? 0,        color: 'text-sp-info',   bg: 'bg-sp-sky' },
          { icon: Package, label: 'Orders (30d)',            value: data?.ordersLast30 ?? 0,        color: 'text-amber-600', bg: 'bg-sp-peach' },
          { icon: DollarSign, label: 'Revenue (30d)',        value: `₹${((data?.revenueLast30 ?? 0)/1000).toFixed(1)}K`, color: 'text-sp-success', bg: 'bg-sp-mint' },
        ].map(item => (
          <div key={item.label} className="bg-white rounded-2xl p-5 border border-sp-border-light shadow-card hover:shadow-card-md transition-shadow">
            <div className={`w-9 h-9 ${item.bg} rounded-xl flex items-center justify-center mb-3`}>
              <item.icon className={`w-4 h-4 ${item.color}`} />
            </div>
            <p className="text-2xl font-bold text-sp-text tracking-tight">{item.value}</p>
            <p className="text-xs text-sp-muted mt-0.5 leading-snug">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Top categories */}
      {data?.topCategories?.length > 0 && (
        <div className="bg-white rounded-2xl border border-sp-border-light shadow-card p-5">
          <h2 className="font-semibold text-sp-text text-sm mb-4 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-sp-purple" /> Top Product Categories
          </h2>
          <div className="space-y-3">
            {data.topCategories.map((cat: any, idx: number) => {
              const max = data.topCategories[0]?.count ?? 1
              const pct = Math.round((cat.count / max) * 100)
              return (
                <div key={cat._id} className="flex items-center gap-3">
                  <span className="w-4 text-xs text-sp-muted font-semibold">{idx + 1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-sp-text">{cat._id ?? 'Uncategorized'}</span>
                      <span className="text-xs text-sp-muted">{cat.count} products</span>
                    </div>
                    <div className="h-1.5 bg-sp-bg rounded-full overflow-hidden">
                      <div
                        className="h-full gradient-card-purple rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Monthly trend */}
      {stats?.monthlyOrders?.length > 0 && (
        <div className="bg-white rounded-2xl border border-sp-border-light shadow-card p-5">
          <h2 className="font-semibold text-sp-text text-sm mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-sp-success" /> Monthly Order Trend
          </h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-sp-muted uppercase tracking-wider mb-3 font-medium">Orders by Month</p>
              <div className="space-y-2">
                {stats.monthlyOrders.map((m: any) => (
                  <div key={m._id} className="flex items-center gap-3">
                    <span className="text-xs text-sp-muted w-16">{m._id}</span>
                    <div className="flex-1 h-1.5 bg-sp-bg rounded-full">
                      <div
                        className="h-full bg-sp-purple rounded-full"
                        style={{ width: `${Math.min((m.count / Math.max(...stats.monthlyOrders.map((x: any) => x.count))) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-sp-text w-8 text-right">{m.count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-sp-muted uppercase tracking-wider mb-3 font-medium">Revenue by Month</p>
              <div className="space-y-2">
                {stats.monthlyOrders.map((m: any) => (
                  <div key={m._id} className="flex items-center gap-3">
                    <span className="text-xs text-sp-muted w-16">{m._id}</span>
                    <div className="flex-1 h-1.5 bg-sp-bg rounded-full">
                      <div
                        className="h-full gradient-card-green rounded-full"
                        style={{ width: `${Math.min((m.revenue / Math.max(...stats.monthlyOrders.map((x: any) => x.revenue))) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-sp-success w-16 text-right">₹{(m.revenue/1000).toFixed(0)}K</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
