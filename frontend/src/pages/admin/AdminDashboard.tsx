import { useEffect, useState, useRef } from 'react'
import { api } from '@/lib/api'
import { motion, AnimatePresence } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { io, Socket } from 'socket.io-client'
import {
  Factory, Users, ShoppingCart, AlertCircle,
  TrendingUp, DollarSign, ShieldCheck, 
  AlertTriangle, Gavel, Clock, ArrowUpRight,
  TrendingDown, Minus, Activity, Package,
  UserPlus, ExternalLink, ChevronRight
} from 'lucide-react'

interface Stats {
  manufacturers: { total: number; pending: number; approved: number; suspended: number }
  buyers: { total: number; active: number; pending: number; flagged: number }
  orders: { today: number; week: number; month: number }
  gmvMonth: number
  gmvLastMonth: number
  gmvChange: number
  commission: number
  disputes: number
  verifications: number
  alerts: number
  liveFeed: {
    registrations: any[]
    orders: any[]
    ordersLastHourCount: number
    flags: any[]
  }
}

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') ?? 'http://localhost:5000';

function StatCard({
  icon: Icon, label, value, subCounts, color, bgColor, onClick, highlight = false
}: {
  icon: any; label: string; value: string | number; 
  subCounts?: { label: string; count: number; filter: string; color: string }[];
  color: string; bgColor: string; onClick?: () => void; highlight?: boolean
}) {
  const navigate = useNavigate();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-[24px] p-5 border shadow-sm transition-all group flex flex-col ${
        highlight ? 'border-amber-200 ring-4 ring-amber-50' : 'border-slate-100 hover:shadow-md'
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div 
          onClick={onClick}
          className={`w-12 h-12 ${bgColor} rounded-[16px] flex items-center justify-center transition-transform group-hover:scale-110 duration-300 cursor-pointer shadow-sm`}
        >
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
        {onClick && (
          <button onClick={onClick} className="p-2 hover:bg-slate-50 rounded-lg text-slate-300 hover:text-slate-500 transition-colors">
            <ExternalLink size={14} />
          </button>
        )}
      </div>

      <div onClick={onClick} className={onClick ? 'cursor-pointer' : ''}>
         <p className="text-3xl font-black text-slate-800 tracking-tight leading-none mb-1">{value}</p>
         <p className="text-[13px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
      </div>

      {subCounts && (
        <div className="mt-5 pt-4 border-t border-slate-50 flex items-center gap-4">
          {subCounts.map((sub, i) => (
            <div 
              key={i} 
              onClick={(e) => { e.stopPropagation(); navigate(sub.filter); }}
              className="flex flex-col cursor-pointer hover:opacity-70 transition-opacity"
            >
              <span className={`text-sm font-black ${sub.color}`}>{sub.count}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{sub.label}</span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}

function GMVCard({ stats }: { stats: Stats }) {
  const navigate = useNavigate();
  const isPos = stats.gmvChange >= 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => navigate('/admin/analytics')}
      className="bg-white rounded-[24px] p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all group cursor-pointer"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 bg-indigo-50 rounded-[16px] flex items-center justify-center transition-transform group-hover:scale-110 duration-300 shadow-sm">
          <TrendingUp className="w-6 h-6 text-indigo-600" />
        </div>
        <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
          isPos ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
        }`}>
          {isPos ? <ArrowUpRight size={10} /> : <TrendingDown size={10} />}
          {Math.abs(stats.gmvChange)}%
        </div>
      </div>
      <div>
         <p className="text-3xl font-black text-slate-800 tracking-tight leading-none mb-1">
           ₹{(stats.gmvMonth / 100000).toFixed(1)}L
         </p>
         <p className="text-[13px] font-bold text-slate-400 uppercase tracking-wider">Gross Merchandise Value</p>
      </div>
      <div className="mt-5 pt-4 border-t border-slate-50">
        <p className="text-[11px] font-bold text-slate-400">
          Last month: <span className="text-slate-600">₹{(stats.gmvLastMonth / 100000).toFixed(1)}L</span>
        </p>
      </div>
    </motion.div>
  )
}

function OrdersCard({ stats }: { stats: Stats }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'today' | 'week' | 'month'>('today');

  const counts = {
    today: stats.orders.today,
    week: stats.orders.week,
    month: stats.orders.month
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-[24px] p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all group"
    >
      <div className="flex items-start justify-between mb-4">
        <div 
          onClick={() => navigate(`/admin/orders?period=${tab}`)}
          className="w-12 h-12 bg-emerald-50 rounded-[16px] flex items-center justify-center transition-transform group-hover:scale-110 duration-300 cursor-pointer shadow-sm"
        >
          <ShoppingCart className="w-6 h-6 text-emerald-600" />
        </div>
        <div className="flex bg-slate-50 p-1 rounded-xl">
           {(['today', 'week', 'month'] as const).map(t => (
             <button 
               key={t}
               onClick={() => setTab(t)}
               className={`px-2 py-1 text-[10px] font-black uppercase rounded-lg transition-all ${
                 tab === t ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
               }`}
             >
               {t}
             </button>
           ))}
        </div>
      </div>
      <div onClick={() => navigate(`/admin/orders?period=${tab}`)} className="cursor-pointer">
         <p className="text-3xl font-black text-slate-800 tracking-tight leading-none mb-1">{counts[tab]}</p>
         <p className="text-[13px] font-bold text-slate-400 uppercase tracking-wider">Total Orders</p>
      </div>
      <div className="mt-5 pt-4 border-t border-slate-50">
        <p className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5 capitalize">
          <Clock size={10} />
          Filtering by {tab}
        </p>
      </div>
    </motion.div>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate();
  const socketRef = useRef<Socket | null>(null);

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

  useEffect(() => {
    fetchAll()

    // Setup WebSocket
    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    socket.emit('join_admin_dashboard');

    socket.on('new_registration', (data) => {
      setStats(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          manufacturers: data.role === 'manufacturer' 
            ? { ...prev.manufacturers, total: prev.manufacturers.total + 1, pending: prev.manufacturers.pending + 1 } 
            : prev.manufacturers,
          buyers: data.role === 'buyer'
            ? { ...prev.buyers, total: prev.buyers.total + 1, pending: prev.buyers.pending + 1 }
            : prev.buyers,
          verifications: prev.verifications + 1,
          liveFeed: {
            ...prev.liveFeed,
            registrations: [data, ...prev.liveFeed.registrations.slice(0, 9)]
          }
        }
      });
    });

    socket.on('new_order', (data) => {
      setStats(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          orders: {
            ...prev.orders,
            today: prev.orders.today + 1,
            week: prev.orders.week + 1,
            month: prev.orders.month + 1
          },
          liveFeed: {
            ...prev.liveFeed,
            orders: [data, ...prev.liveFeed.orders.slice(0, 4)],
            ordersLastHourCount: prev.liveFeed.ordersLastHourCount + 1
          }
        }
      });
    });

    socket.on('new_flag', (data) => {
      setStats(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          alerts: prev.alerts + 1,
          disputes: prev.disputes + 1,
          liveFeed: {
            ...prev.liveFeed,
            flags: [data, ...prev.liveFeed.flags.slice(0, 9)]
          }
        }
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [])

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Activity className="w-8 h-8 text-amber-600 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-10 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-3xl font-black text-slate-800 tracking-tight">Main Dashboard</h1>
           <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs">Platform Core Metrics</p>
        </div>
        <div className="flex items-center gap-3">
           <button 
             onClick={fetchAll}
             className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 text-xs font-black rounded-2xl hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm"
           >
             <Clock size={14} />
             REFRESH DATA
           </button>
           <button className="px-6 py-2.5 bg-slate-900 text-white text-xs font-black rounded-2xl shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all flex items-center gap-2">
             <ExternalLink size={14} />
             EXPORT REPORT
           </button>
        </div>
      </div>

      {/* Main Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={Factory} label="Manufacturers" value={stats.manufacturers.total}
          onClick={() => navigate('/admin/manufacturers')}
          subCounts={[
            { label: 'Active', count: stats.manufacturers.approved, filter: '/admin/manufacturers?status=approved', color: 'text-emerald-500' },
            { label: 'Pending', count: stats.manufacturers.pending, filter: '/admin/verification', color: 'text-amber-500' },
            { label: 'Suspended', count: stats.manufacturers.suspended, filter: '/admin/manufacturers?status=suspended', color: 'text-rose-500' },
          ]}
          color="text-amber-600" bgColor="bg-amber-50"
        />
        <StatCard 
          icon={Users} label="Total Buyers" value={stats.buyers.total}
          onClick={() => navigate('/admin/buyers')}
          subCounts={[
            { label: 'Active', count: stats.buyers.active, filter: '/admin/buyers?status=active', color: 'text-blue-500' },
            { label: 'Pending', count: stats.buyers.pending, filter: '/admin/buyers?status=pending', color: 'text-amber-500' },
            { label: 'Flagged', count: stats.buyers.flagged, filter: '/admin/monitoring/suspicious', color: 'text-rose-500' },
          ]}
          color="text-blue-600" bgColor="bg-blue-50"
        />
        
        <OrdersCard stats={stats} />
        <GMVCard stats={stats} />

        <StatCard 
          icon={DollarSign} label="Platform Revenue" value={`₹${(stats.commission / 1000).toFixed(1)}K`}
          onClick={() => navigate('/admin/finance/commission')}
          color="text-emerald-600" bgColor="bg-emerald-50"
        />
        <StatCard 
          icon={Gavel} label="Open Disputes" value={stats.disputes}
          onClick={() => navigate('/admin/complaints?status=escalated')}
          color="text-rose-600" bgColor="bg-rose-50"
          highlight={stats.disputes > 0}
        />
        <StatCard 
          icon={ShieldCheck} label="Pending Verification" value={stats.verifications}
          onClick={() => navigate('/admin/verification')}
          color="text-amber-600" bgColor="bg-amber-50"
          highlight={stats.verifications > 0}
        />
        <StatCard 
          icon={AlertTriangle} label="Suspicious Alerts" value={stats.alerts}
          onClick={() => navigate('/admin/monitoring/suspicious')}
          color="text-rose-600" bgColor="bg-rose-50"
        />
      </div>

      {/* Analytics Placeholder */}
      <div className="bg-white rounded-[40px] border border-slate-100 p-10 shadow-sm relative overflow-hidden">
         <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
            <Activity size={200} />
         </div>
         <div className="flex flex-col md:flex-row items-center justify-between mb-10 relative z-10">
            <div>
               <h2 className="text-2xl font-black text-slate-800 tracking-tight">Growth Analytics</h2>
               <p className="text-sm font-bold text-slate-400">Monthly breakdown of platform activity</p>
            </div>
            <button 
              onClick={() => navigate('/admin/analytics')}
              className="mt-4 md:mt-0 px-6 py-2 bg-indigo-50 text-indigo-600 text-xs font-black rounded-xl hover:bg-indigo-100 transition-all flex items-center gap-2"
            >
              VIEW DETAILED GRAPHS <ChevronRight size={14} />
            </button>
         </div>
         <div className="h-[250px] flex items-center justify-center border-2 border-dashed border-slate-100 rounded-[32px]">
            <div className="text-center">
               <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3 mx-auto">
                 <Activity className="text-slate-300" />
               </div>
               <p className="text-slate-300 font-black uppercase tracking-[0.2em] text-[10px]">Visualization Engine Ready</p>
            </div>
         </div>
      </div>

      {/* Live Feed Section (Bottom) */}
      <div className="pt-10 border-t border-slate-100">
         <div className="flex items-center justify-between mb-8">
            <div>
               <h2 className="text-2xl font-black text-slate-800 tracking-tight">System Live Feed</h2>
               <p className="text-sm font-bold text-slate-400">Real-time platform events appearing instantly</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Last Hour Orders</span>
                <span className="text-lg font-black text-emerald-600">{stats.liveFeed.ordersLastHourCount}</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
                 <span className="w-3 h-3 bg-emerald-500 rounded-full animate-ping" />
              </div>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Registrations List */}
            <div className="bg-slate-900 rounded-[32px] p-8 shadow-2xl relative overflow-hidden group">
               <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl group-hover:bg-amber-500/20 transition-all" />
               <div className="flex items-center gap-3 mb-8">
                  <div className="p-2 bg-amber-500/20 rounded-xl">
                    <UserPlus className="text-amber-400" size={18} />
                  </div>
                  <h3 className="text-white font-black tracking-tight text-lg">New Signups</h3>
               </div>
               <div className="space-y-4 max-h-[400px] overflow-y-auto no-scrollbar">
                  <AnimatePresence initial={false}>
                    {stats.liveFeed.registrations.map((reg, i) => (
                      <motion.div 
                        key={reg.email || i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white/5 transition-all cursor-default"
                      >
                         <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-xs font-black text-amber-500">
                            {reg.name[0]}
                         </div>
                         <div className="flex-1">
                            <p className="text-white text-sm font-bold">{reg.name}</p>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{reg.role}</p>
                         </div>
                         <div className="text-[9px] font-black text-slate-600 bg-slate-800 px-2 py-1 rounded-lg">
                           TODAY
                         </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
               </div>
            </div>

            {/* Orders Feed */}
            <div className="bg-slate-900 rounded-[32px] p-8 shadow-2xl relative overflow-hidden group">
               <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all" />
               <div className="flex items-center gap-3 mb-8">
                  <div className="p-2 bg-emerald-500/20 rounded-xl">
                    <Package className="text-emerald-400" size={18} />
                  </div>
                  <h3 className="text-white font-black tracking-tight text-lg">Recent Orders</h3>
               </div>
               <div className="space-y-4 max-h-[400px] overflow-y-auto no-scrollbar">
                  <AnimatePresence initial={false}>
                    {stats.liveFeed.orders.map((order, i) => (
                      <motion.div 
                        key={order.orderId || i}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-4 p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-emerald-500/30 transition-all"
                      >
                         <div className="flex-1">
                            <p className="text-white text-sm font-black">{order.orderId}</p>
                            <p className="text-[10px] font-bold text-emerald-500 uppercase">{order.value}</p>
                         </div>
                         <div className="text-right">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                               {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                         </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {stats.liveFeed.orders.length === 0 && (
                    <p className="text-slate-600 text-sm font-bold text-center py-10">No recent orders</p>
                  )}
               </div>
            </div>

            {/* Flagged Activities */}
            <div className="bg-slate-900 rounded-[32px] p-8 shadow-2xl relative overflow-hidden group">
               <div className="absolute -top-10 -right-10 w-40 h-40 bg-rose-500/10 rounded-full blur-3xl group-hover:bg-rose-500/20 transition-all" />
               <div className="flex items-center gap-3 mb-8">
                  <div className="p-2 bg-rose-500/20 rounded-xl">
                    <AlertTriangle className="text-rose-400" size={18} />
                  </div>
                  <h3 className="text-white font-black tracking-tight text-lg">Critical Flags</h3>
               </div>
               <div className="space-y-4 max-h-[400px] overflow-y-auto no-scrollbar">
                  <AnimatePresence initial={false}>
                    {stats.liveFeed.flags.map((flag, i) => (
                      <motion.div 
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/15 transition-all cursor-pointer"
                        onClick={() => navigate('/admin/monitoring/suspicious')}
                      >
                         <div className="flex items-start justify-between mb-2">
                           <p className="text-rose-200 text-xs font-black uppercase tracking-wider">{flag.title}</p>
                           <AlertCircle size={14} className="text-rose-500" />
                         </div>
                         <p className="text-white text-sm font-bold mb-1">{flag.company}</p>
                         <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black px-2 py-0.5 bg-rose-500 text-white rounded-md uppercase">Escalated</span>
                            <span className="text-[10px] font-bold text-slate-500">
                               {new Date(flag.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                         </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {stats.liveFeed.flags.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 opacity-40">
                       <ShieldCheck className="text-emerald-500 mb-2" size={32} />
                       <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Platform Healthy</p>
                    </div>
                  )}
               </div>
            </div>
         </div>
      </div>
    </div>
  )
}



