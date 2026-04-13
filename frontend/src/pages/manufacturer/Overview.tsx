import { useState, useEffect } from 'react'
import {
  Download, Plus, TrendingUp, ShoppingBag,
  BarChart2, Package, AlertTriangle, MessageSquare,
  Zap, ChevronRight, Loader2, ArrowRight, X, Star, CheckCircle
} from 'lucide-react'
import { motion } from 'motion/react'
import { api, Order } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { useNavigate } from 'react-router-dom'

// ── Simulated weekly bar data ─────────────────────────────────────────────
const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

function getHour() { return new Date().getHours() }
function greeting() {
  const h = getHour()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function Overview() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Simulated bar heights for production velocity
  const barHeights = [45, 60, 100, 55, 70, 40, 50]
  const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1

  useEffect(() => {
    Promise.all([
      api.getOrders().catch(() => []),
      api.getManufacturerStats().catch(() => ({
        todayRevenue: 0, todayOrderCount: 0, pendingShipments: 0,
        activeDeals: 0, totalProducts: 0,
      }))
    ]).then(([ordersData, statsData]) => {
      setOrders(Array.isArray(ordersData) ? ordersData : [])
      setStats(statsData)
    }).finally(() => setLoading(false))
  }, [])

  const handleDismissWelcome = async () => {
    try {
      await api.dismissWelcomeBack();
      setStats((prev: any) => ({
        ...prev,
        holidaySettings: { ...prev.holidaySettings, showWelcomeBack: false }
      }));
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#5D4037' }} />
      </div>
    )
  }

  const activeOrders = orders.filter(o => o.status === 'In Production' || o.status === 'Pending Payment')
  const totalRevenue = stats?.todayRevenue ?? 0
  const activeOrderCount = stats?.todayOrderCount ?? orders.length
  const efficiency = 94.2
  const stockLevel = stats?.totalProducts ?? 0

  // Material supply mock (real app would come from inventory API)
  const materials = [
    { name: 'Premium Calf Leather', pct: 82, color: '#5D4037', warn: false },
    { name: 'Organic Cotton Canvas', pct: 12, color: '#EF4444', warn: true },
    { name: 'Brass Hardware Set', pct: 45, color: '#3B82F6', warn: false },
  ]

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: '#FAF8F5' }}>
      <div className="p-4 sm:p-6 lg:p-8">

        {/* ── Holiday Summary (Welcome Back) ── */}
        {stats?.holidaySettings?.showWelcomeBack && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 relative rounded-[2rem] overflow-hidden border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-8 shadow-lg"
          >
            <button
              onClick={handleDismissWelcome}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-all shadow-sm"
            >
              <X size={14} />
            </button>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg">
                <Star size={22} className="text-white fill-white" />
              </div>
              <div>
                <h3 className="text-xl font-black text-emerald-900 tracking-tight">Welcome Back! 🎉</h3>
                <p className="text-sm text-emerald-700 font-medium">
                  Here's a summary of activity during your holiday session
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'New Orders',     value: stats.holidaySettings.holidayStats?.ordersReceived ?? 0,      icon: ShoppingBag,  color: 'bg-white text-blue-600' },
                { label: 'Negotiations',   value: stats.holidaySettings.holidayStats?.negotiationsStarted ?? 0, icon: MessageSquare, color: 'bg-white text-purple-600' },
                { label: 'Complaints',     value: stats.holidaySettings.holidayStats?.complaintsReceived ?? 0,  icon: AlertTriangle, color: 'bg-white text-orange-600' },
              ].map(stat => (
                <div key={stat.label} className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${stat.color}`}>
                    <stat.icon size={18} />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-slate-900">{stat.value}</p>
                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider font-bold">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Greeting + Actions ── */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight tracking-tight">
              {greeting()},{' '}
              <span className="font-bold" style={{ color: '#8B6F5E' }}>
                {user?.name?.split(' ')[0] ?? 'there'}.
              </span>
              {stats?.holidaySettings?.isOnHoliday && (
                <span className="ml-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-600 text-xs font-black uppercase tracking-widest border border-red-200">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  Holiday Mode Active
                </span>
              )}
            </h1>
            <p className="text-slate-500 mt-1.5 text-sm max-w-md leading-relaxed">
              Your manufacturing pipeline is currently operating at{' '}
              <span className="font-semibold" style={{ color: '#5D4037' }}>{efficiency}% efficiency</span>.{' '}
              {activeOrders.length} orders are ready for final inspection.
            </p>
          </div>
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-medium hover:bg-slate-50 transition-all shadow-sm"
            >
              <Download size={15} /> Export Report
            </button>
            <button
              onClick={() => navigate('/manufacturer/orders')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-all shadow-sm"
              style={{ background: '#5D4037' }}
            >
              <Plus size={15} /> New Batch
            </button>
          </div>
        </div>

        {/* ── 4 Stat Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            {
              icon: TrendingUp, label: 'Total Revenue',
              value: `₹${totalRevenue.toLocaleString('en-IN')}`,
              sub: '+12.5% this month', subColor: 'text-green-600',
              bg: 'bg-white', iconBg: 'bg-orange-50', iconColor: 'text-orange-500',
            },
            {
              icon: ShoppingBag, label: 'Active Orders',
              value: activeOrderCount,
              sub: `${orders.filter(o => o.status === 'Shipped').length} shipments in transit`,
              subColor: 'text-slate-400',
              bg: 'bg-white', iconBg: 'bg-blue-50', iconColor: 'text-blue-500',
            },
            {
              icon: BarChart2, label: 'Efficiency Rate',
              value: `${efficiency}%`,
              sub: null, progress: efficiency,
              bg: 'bg-white', iconBg: 'bg-purple-50', iconColor: 'text-purple-500',
            },
            {
              icon: Package, label: 'Stock Level',
              value: stockLevel.toLocaleString(),
              sub: `${stats?.lowStockAlerts ?? 0} items low stock`,
              subColor: stats?.lowStockAlerts > 0 ? 'text-red-500' : 'text-slate-400',
              warn: (stats?.lowStockAlerts ?? 0) > 0,
              bg: 'bg-white', iconBg: 'bg-slate-100', iconColor: 'text-slate-500',
            },
          ].map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className={`${card.bg} rounded-2xl p-5 border border-slate-100 shadow-card hover:shadow-card-md transition-shadow`}
            >
              <div className={`w-9 h-9 ${card.iconBg} rounded-xl flex items-center justify-center mb-4`}>
                <card.icon size={18} className={card.iconColor} />
              </div>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 mb-1">{card.label}</p>
              <p className="text-2xl font-bold text-slate-900 mb-1 tracking-tight">{card.value}</p>
              {card.progress !== undefined && (
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${card.progress}%`, background: '#A78BFA' }}
                  />
                </div>
              )}
              {card.sub && (
                <p className={`text-xs font-medium mt-1.5 flex items-center gap-1 ${card.subColor}`}>
                  {card.warn && <AlertTriangle size={11} />}
                  {card.sub}
                </p>
              )}
            </motion.div>
          ))}
        </div>

        {/* ── Main 2-col layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left: Production Velocity + Active Batches ── */}
          <div className="lg:col-span-2 flex flex-col gap-6">

            {/* Production Velocity Chart */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  <span className="w-1 h-4 rounded-full inline-block" style={{ background: '#5D4037' }} />
                  Production Velocity
                </h3>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-all">
                  Last 7 Days <ChevronRight size={12} />
                </button>
              </div>

              {/* Bar chart */}
              <div className="flex items-end justify-between gap-2 h-40 px-2">
                {DAYS.map((day, i) => {
                  const h = barHeights[i]
                  const isToday = i === todayIdx
                  return (
                    <div key={day} className="flex-1 flex flex-col items-center gap-2">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${h}%` }}
                        transition={{ delay: i * 0.05, duration: 0.5, ease: 'easeOut' }}
                        className="w-full rounded-t-xl"
                        style={{
                          background: isToday ? '#5D4037' : '#F5E6D3',
                          minHeight: '8px',
                        }}
                      />
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${isToday ? 'text-slate-800' : 'text-slate-400'}`}>
                        {day}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Active Manufacturing Batches */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-semibold text-slate-900">Active Manufacturing Batches</h3>
                <button
                  onClick={() => navigate('/manufacturer/orders')}
                  className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1"
                >
                  View All <ArrowRight size={12} />
                </button>
              </div>

              <div className="flex flex-col gap-2">
                {activeOrders.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-8">No active batches right now.</p>
                ) : activeOrders.slice(0, 4).map((order, idx) => {
                  const statusLabel = order.status === 'In Production' ? 'In Progress' : 'Finishing'
                  const statusColor = order.status === 'In Production'
                    ? 'bg-purple-50 text-purple-600'
                    : 'bg-blue-50 text-blue-600'
                  const icons = ['📦', '🚚', '🏭', '✂️']

                  return (
                    <div
                      key={order._id}
                      className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer group"
                      onClick={() => navigate('/manufacturer/orders')}
                    >
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                        style={{ background: '#F5E6D3' }}>
                        {icons[idx % icons.length]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">
                          {order.orderId} — {order.items}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {order.value} · Due {order.expectedDate}
                        </p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold flex-shrink-0 ${statusColor}`}>
                        {statusLabel}
                      </span>
                      <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-500 transition-colors flex-shrink-0" />
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* ── Right: Material Supply + New Negotiations + Factory View ── */}
          <div className="flex flex-col gap-6">

            {/* Material Supply */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6">
              <h3 className="text-base font-semibold text-slate-900 mb-5">Material Supply</h3>
              <div className="flex flex-col gap-4">
                {materials.map((m, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-sm font-medium text-slate-700">{m.name}</p>
                      <span className={`text-sm font-semibold ${m.warn ? 'text-red-500' : 'text-slate-700'}`}>{m.pct}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${m.pct}%` }}
                        transition={{ delay: i * 0.1 + 0.3, duration: 0.6, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{ background: m.color }}
                      />
                    </div>
                    {m.warn && (
                      <p className="text-[10px] font-semibold uppercase tracking-wider mt-1 flex items-center gap-1" style={{ color: '#EF4444' }}>
                        <AlertTriangle size={10} /> Reorder Suggested
                      </p>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={() => navigate('/manufacturer/inventory')}
                className="w-full mt-5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-all"
              >
                Manage Inventory
              </button>
            </div>

            {/* New Negotiations */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-semibold text-slate-900">New Negotiations</h3>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm"
                  style={{ background: '#5D4037' }}>
                  <Zap size={14} />
                </div>
              </div>

              <div className="flex flex-col gap-3 mb-4">
                {orders.slice(0, 2).map((order, i) => {
                  const initials = order.buyer?.initials || order.buyer?.name?.slice(0, 2).toUpperCase() || 'JD'
                  const colors = ['bg-blue-100 text-blue-700', 'bg-purple-100 text-purple-700']
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${colors[i % 2]}`}>
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{order.buyer?.name || 'Buyer'}</p>
                        <p className="text-xs text-slate-400 truncate">
                          {order.status === 'Pending Payment' ? 'Responded to quote' : `Inquiry for ${order.items}`}
                        </p>
                      </div>
                    </div>
                  )
                })}
                {orders.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-4">No active negotiations.</p>
                )}
              </div>

              <button
                onClick={() => navigate('/manufacturer/negotiation')}
                className="w-full py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-all"
                style={{ background: '#5D4037' }}
              >
                Go to Inbox
              </button>
            </div>

            {/* Factory View placeholder */}
            <div
              className="rounded-[1.5rem] overflow-hidden relative cursor-pointer group"
              style={{ minHeight: '120px', background: '#1C1C1C' }}
              onClick={() => navigate('/manufacturer/store')}
            >
              <img
                src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&h=300&fit=crop"
                alt="Factory"
                className="w-full h-full object-cover opacity-60 group-hover:opacity-70 transition-opacity"
                style={{ minHeight: '120px' }}
              />
              <div className="absolute inset-0 p-4 flex flex-col justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white">Live</span>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-white/60 font-bold">Factory View</p>
                  <p className="text-sm font-black text-white">Main Atelier — Floor A</p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ── Bottom quick-action cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pb-8">
          {[
            { title: 'Inventory Alert', desc: `${stats?.totalProducts || 0} active products. Consider adding more to increase visibility.`, link: '/manufacturer/inventory', cta: 'Manage Inventory' },
            { title: 'Shipping Optimization', desc: `${stats?.pendingShipments || 0} pending shipments. Fast processing increases your rating.`, link: '/manufacturer/shipment', cta: 'View Logistics' },
            { title: 'Negotiation Status', desc: `${stats?.activeDeals || 0} active threads. Quick responses help close deals effectively.`, link: '/manufacturer/negotiation', cta: 'Open Negotiation' },
          ].map((card, i) => (
            <div
              key={i}
              onClick={() => navigate(card.link)}
              className="bg-white rounded-2xl border border-slate-100 shadow-card p-5 cursor-pointer hover:shadow-card-md transition-shadow group"
            >
              <h4 className="text-sm font-semibold text-slate-900 mb-2">{card.title}</h4>
              <p className="text-sm text-slate-500 leading-relaxed mb-4">{card.desc}</p>
              <button className="flex items-center gap-1.5 text-sm font-medium text-slate-700 group-hover:gap-2.5 transition-all">
                {card.cta} <ArrowRight size={14} />
              </button>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
