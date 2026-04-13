import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import {
  Factory, Users, ShoppingCart, AlertCircle,
  TrendingUp, Package, DollarSign, Clock,
  CheckCircle, XCircle, BarChart2
} from 'lucide-react'

interface Stats {
  totalManufacturers: number
  pendingManufacturers: number
  approvedManufacturers: number
  totalBuyers: number
  totalOrders: number
  pendingComplaints: number
  totalProducts: number
  totalRevenue: number
  monthlyOrders: { _id: string; count: number; revenue: number }[]
}

function StatCard({
  icon: Icon, label, value, sub, color, bgColor
}: {
  icon: any; label: string; value: string | number; sub?: string; color: string; bgColor: string
}) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-sp-border-light shadow-card hover:shadow-card-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 ${bgColor} rounded-xl flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
      </div>
      <p className="text-2xl font-bold text-sp-text tracking-tight">{value}</p>
      <p className="text-sm font-medium text-sp-muted mt-0.5">{label}</p>
      {sub && <p className="text-xs text-sp-placeholder mt-1.5 flex items-center gap-1">{sub}</p>}
    </div>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [recentManufacturers, setRecentManufacturers] = useState<any[]>([])
  const [recentComplaints, setRecentComplaints] = useState<any[]>([])

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [statsData, mfrData, cmpData] = await Promise.all([
          api.getAdminStats(),
          api.getAdminManufacturers({ status: 'pending', limit: 5 }),
          api.getAdminComplaints({ status: 'PENDING', limit: 5 }),
        ])
        setStats(statsData)
        setRecentManufacturers(mfrData.data ?? [])
        setRecentComplaints(cmpData.data ?? [])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-sp-purple border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-5 sm:p-6 space-y-5 sm:space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold text-sp-text tracking-tight">Admin Dashboard</h1>
        <p className="text-sp-muted text-sm mt-0.5">Platform overview and key metrics</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={Factory} label="Total Manufacturers" value={stats?.totalManufacturers ?? 0}
          sub={`${stats?.pendingManufacturers ?? 0} pending approval`}
          color="text-sp-purple" bgColor="bg-sp-purple-pale" />
        <StatCard icon={Users} label="Total Buyers" value={stats?.totalBuyers ?? 0}
          color="text-sp-info" bgColor="bg-sp-sky" />
        <StatCard icon={ShoppingCart} label="Total Orders" value={stats?.totalOrders ?? 0}
          color="text-sp-success" bgColor="bg-sp-mint" />
        <StatCard icon={AlertCircle} label="Pending Complaints" value={stats?.pendingComplaints ?? 0}
          color="text-amber-600" bgColor="bg-sp-peach" />
        <StatCard icon={Package} label="Active Products" value={stats?.totalProducts ?? 0}
          color="text-indigo-600" bgColor="bg-indigo-50" />
        <StatCard icon={DollarSign} label="Platform Revenue" value={`₹${((stats?.totalRevenue ?? 0) / 100000).toFixed(1)}L`}
          color="text-sp-success" bgColor="bg-sp-mint" />
        <StatCard icon={CheckCircle} label="Approved Manufacturers" value={stats?.approvedManufacturers ?? 0}
          color="text-sp-success" bgColor="bg-sp-mint" />
        <StatCard icon={Clock} label="Pending Approvals" value={stats?.pendingManufacturers ?? 0}
          color="text-amber-600" bgColor="bg-sp-peach" />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Pending manufacturer approvals */}
        <div className="bg-white rounded-2xl border border-sp-border-light shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sp-text text-sm">Pending Manufacturer Approvals</h2>
            <a href="/admin/manufacturers" className="text-xs text-sp-purple font-medium hover:underline">
              View all →
            </a>
          </div>
          {recentManufacturers.length === 0 ? (
            <div className="text-center py-8 text-sp-muted text-sm">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-sp-success opacity-50" />
              No pending approvals
            </div>
          ) : (
            <div className="space-y-2">
              {recentManufacturers.map((m: any) => (
                <div key={m._id} className="flex items-center gap-3 p-3 bg-sp-bg rounded-xl hover:bg-sp-border-light transition-colors">
                  <div className="w-8 h-8 bg-sp-purple-pale rounded-full flex items-center justify-center text-sp-purple font-semibold text-sm flex-shrink-0">
                    {m.name?.[0] ?? 'M'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-sp-text truncate">{m.name}</p>
                    <p className="text-xs text-sp-muted truncate">{m.company} · {m.location}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => api.approveManufacturer(m._id).then(() => setRecentManufacturers(prev => prev.filter(x => x._id !== m._id)))}
                      className="p-1.5 bg-sp-mint text-sp-success rounded-lg hover:opacity-80 transition-all"
                      title="Approve"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => api.rejectManufacturer(m._id, 'Incomplete documentation').then(() => setRecentManufacturers(prev => prev.filter(x => x._id !== m._id)))}
                      className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:opacity-80 transition-all"
                      title="Reject"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent complaints */}
        <div className="bg-white rounded-2xl border border-sp-border-light shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sp-text text-sm">Recent Complaints</h2>
            <a href="/admin/complaints" className="text-xs text-sp-purple font-medium hover:underline">
              View all →
            </a>
          </div>
          {recentComplaints.length === 0 ? (
            <div className="text-center py-8 text-sp-muted text-sm">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-sp-success opacity-50" />
              No pending complaints
            </div>
          ) : (
            <div className="space-y-2">
              {recentComplaints.map((c: any) => (
                <div key={c._id} className="flex items-start gap-3 p-3 bg-sp-bg rounded-xl hover:bg-sp-border-light transition-colors">
                  <div className="w-8 h-8 bg-red-50 rounded-full flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-sp-text truncate">{c.title}</p>
                    <p className="text-xs text-sp-muted">{c.company} · {c.category}</p>
                    <span className={`inline-block mt-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      c.status === 'ESCALATED' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {c.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Monthly orders chart (text table) */}
      {stats?.monthlyOrders && stats.monthlyOrders.length > 0 && (
        <div className="bg-white rounded-2xl border border-sp-border-light shadow-card p-5">
          <h2 className="font-semibold text-sp-text text-sm mb-4 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-sp-purple" />
            Monthly Performance
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-sp-border-light">
                  <th className="text-left py-2.5 px-3 text-[11px] font-semibold text-sp-muted uppercase tracking-wider">Month</th>
                  <th className="text-right py-2.5 px-3 text-[11px] font-semibold text-sp-muted uppercase tracking-wider">Orders</th>
                  <th className="text-right py-2.5 px-3 text-[11px] font-semibold text-sp-muted uppercase tracking-wider">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sp-border-light">
                {stats.monthlyOrders.map((row) => (
                  <tr key={row._id} className="hover:bg-sp-bg transition-colors">
                    <td className="py-3 px-3 text-sm font-medium text-sp-text">{row._id}</td>
                    <td className="py-3 px-3 text-sm text-right text-sp-text">{row.count}</td>
                    <td className="py-3 px-3 text-sm text-right text-sp-purple font-semibold">
                      ₹{(row.revenue / 1000).toFixed(1)}K
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
