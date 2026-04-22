import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { motion } from 'motion/react'
import {
  Factory, Users, ShoppingCart, AlertCircle,
  TrendingUp, DollarSign, ShieldCheck, 
  AlertTriangle, Gavel, Clock, ArrowUpRight,
  TrendingDown, Minus, Activity, Package
} from 'lucide-react'

interface Stats {
  manufacturers: { total: number; pending: number; approved: number; suspended: number }
  buyers: { total: number; active: number; pending: number; flagged: number }
  orders: { today: number; week: number; month: number }
  gmvMonth: number
  commission: number
  disputes: number
  verifications: number
  alerts: number
  liveFeed: {
    registrations: any[]
    orders: any[]
    flags: any[]
  }
}

function StatCard({
  icon: Icon, label, value, sub, subType, color, bgColor
}: {
  icon: any; label: string; value: string | number; sub?: string; subType?: 'pos' | 'neg' | 'neutral'; color: string; bgColor: string
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-[24px] p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 ${bgColor} rounded-[14px] flex items-center justify-center transition-transform group-hover:scale-110 duration-300`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        {subType && (
          <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
            subType === 'pos' ? 'bg-emerald-50 text-emerald-600' : 
            subType === 'neg' ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-500'
          }`}>
            {subType === 'pos' ? <ArrowUpRight size={10} /> : subType === 'neg' ? <TrendingDown size={10} /> : <Minus size={10} />}
            12%
          </div>
        )}
      </div>
      <div>
         <p className="text-2xl font-black text-slate-800 tracking-tight">{value}</p>
         <p className="text-[13px] font-bold text-slate-400 mt-0.5">{label}</p>
      </div>
      {sub && (
        <div className="mt-4 pt-4 border-t border-slate-50">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-slate-200" />
            {sub}
          </p>
        </div>
      )}
    </motion.div>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const statsData = await api.getAdminStats()
        setStats(statsData)
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <Activity className="w-8 h-8 text-amber-600 animate-pulse" />
      </div>
    )
  }

  const formatCurrency = (val: number) => {
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`
    if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K`
    return `₹${val}`
  }

  return (
    <div className="space-y-6">
      {/* Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={Factory} label="Manufacturers" value={stats?.manufacturers.total ?? 0}
          sub={`${stats?.manufacturers.pending ?? 0} Pending Review`}
          color="text-amber-600" bgColor="bg-amber-50"
        />
        <StatCard 
          icon={Users} label="Total Buyers" value={stats?.buyers.total ?? 0}
          sub={`${stats?.buyers.active ?? 0} Active Now`}
          color="text-blue-600" bgColor="bg-blue-50"
        />
        <StatCard 
          icon={ShoppingCart} label="Orders Today" value={stats?.orders.today ?? 0}
          sub={`${stats?.orders.month ?? 0} This Month`}
          color="text-emerald-600" bgColor="bg-emerald-50"
        />
        <StatCard 
          icon={TrendingUp} label="Month GMV" value={formatCurrency(stats?.gmvMonth ?? 0)}
          sub="Projected ₹12L"
          color="text-indigo-600" bgColor="bg-indigo-50"
        />
        <StatCard 
          icon={DollarSign} label="Commission" value={formatCurrency(stats?.commission ?? 0)}
          sub="5% Platform Fee"
          color="text-emerald-600" bgColor="bg-emerald-50"
        />
        <StatCard 
          icon={Gavel} label="Open Disputes" value={stats?.disputes ?? 0}
          sub="2 Escalated"
          color="text-rose-600" bgColor="bg-rose-50"
        />
        <StatCard 
          icon={ShieldCheck} label="Verifications" value={stats?.verifications ?? 0}
          sub="Action Required"
          color="text-amber-600" bgColor="bg-amber-50"
        />
        <StatCard 
          icon={AlertTriangle} label="Suspicious" value={stats?.alerts ?? 0}
          sub="Flagged Activities"
          color="text-rose-600" bgColor="bg-rose-50"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content Areas */}
        <div className="lg:col-span-2 space-y-6">
           <div className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                 <div>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">Platform Growth</h2>
                    <p className="text-sm font-bold text-slate-400">Order & Registration Volume</p>
                 </div>
                 <div className="flex gap-2">
                    <button className="px-4 py-2 bg-slate-50 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-100 transition-all border border-slate-100">7 Days</button>
                    <button className="px-4 py-2 bg-amber-600 text-white text-xs font-bold rounded-xl shadow-md shadow-amber-100 transition-all">30 Days</button>
                 </div>
              </div>
              <div className="h-[300px] flex items-center justify-center border-2 border-dashed border-slate-100 rounded-[24px]">
                 <p className="text-slate-300 font-bold uppercase tracking-widest text-xs">Analytics Visualization Engine</p>
              </div>
           </div>
        </div>

        {/* Live Feed Sidebar */}
        <div className="space-y-6">
           <div className="bg-slate-900 rounded-[32px] p-6 text-white shadow-xl">
              <div className="flex items-center justify-between mb-6">
                 <h3 className="font-black tracking-tight text-lg">Live Feed</h3>
                 <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-mono">Live</span>
                 </div>
              </div>

              <div className="space-y-6">
                 {/* Registrations */}
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4">New Partners</p>
                    <div className="space-y-3">
                       {stats?.liveFeed.registrations.length === 0 ? (
                          <p className="text-xs text-slate-600 font-medium">No registrations today</p>
                       ) : (
                          stats?.liveFeed.registrations.map((reg, i) => (
                             <div key={i} className="flex items-center gap-3 group pointer-cursor">
                                <div className="w-8 h-8 bg-slate-800 rounded-xl flex items-center justify-center text-xs font-black text-slate-400 transition-colors group-hover:bg-amber-600 group-hover:text-white">
                                   {reg.name[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                   <p className="text-xs font-bold truncate group-hover:text-amber-500 transition-colors">{reg.name}</p>
                                   <p className="text-[10px] font-bold text-slate-500 uppercase">{reg.role}</p>
                                </div>
                                <Clock size={10} className="text-slate-600" />
                             </div>
                          ))
                       )}
                    </div>
                 </div>

                 {/* Recent Orders */}
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4">Recent Sales</p>
                    <div className="space-y-3">
                       {stats?.liveFeed.orders.map((order, i) => (
                          <div key={i} className="flex items-center gap-3">
                             <div className="w-8 h-8 bg-slate-800 rounded-xl flex items-center justify-center">
                                <Package size={12} className="text-slate-400" />
                             </div>
                             <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold truncate">#{order.orderId}</p>
                                <p className="text-[10px] font-bold text-emerald-500 uppercase">{order.value}</p>
                             </div>
                             <span className="text-[9px] font-mono text-slate-600">NEW</span>
                          </div>
                       ))}
                    </div>
                 </div>

                 {/* Alerts */}
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500/50 mb-4">Critical Flags</p>
                    <div className="space-y-3">
                       {stats?.liveFeed.flags.length === 0 ? (
                          <p className="text-xs text-slate-600 font-medium">System healthy · No flags</p>
                       ) : (
                          stats?.liveFeed.flags.map((flag, i) => (
                             <div key={i} className="flex items-start gap-3 p-3 bg-rose-500/10 rounded-2xl border border-rose-500/20">
                                <AlertCircle size={14} className="text-rose-500 flex-shrink-0 mt-0.5" />
                                <div>
                                   <p className="text-xs font-bold text-rose-200">{flag.title}</p>
                                   <p className="text-[10px] font-medium text-rose-500/80">{flag.company}</p>
                                </div>
                             </div>
                          ))
                       )}
                    </div>
                 </div>
              </div>

              <button className="w-full mt-8 py-3 bg-white/5 hover:bg-white/10 text-[11px] font-black uppercase tracking-widest text-slate-400 rounded-2xl transition-all border border-white/5">
                 View Incident Log
              </button>
           </div>
        </div>
      </div>
    </div>
  )
}
