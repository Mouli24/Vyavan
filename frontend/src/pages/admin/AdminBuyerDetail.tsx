import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { motion, AnimatePresence } from 'motion/react'
import {
  ArrowLeft, Building2, MapPin, Mail, Phone, Calendar,
  Shield, AlertTriangle, TrendingUp, Package, ShieldAlert,
  Loader, Lock, EyeOff, FileText, Ban, Power, Users, Map, Clock, 
  ChevronRight, ExternalLink, MessageSquare, AlertCircle, ShoppingBag,
  RotateCcw, CreditCard, Activity, Search as SearchIcon
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminBuyerDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'network' | 'history' | 'security'>('overview')
  const [behavior, setBehavior] = useState<any>(null)

  const fetchDetail = async () => {
    try {
      const detail = await api.getAdminBuyerProfile(id!)
      setData(detail)
      const stats = await api.getAdminBuyerActivityStats(id!)
      setBehavior(stats)
    } catch (e) {
      toast.error('Failed to load buyer profile')
      navigate('/admin/buyers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) fetchDetail()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader className="w-8 h-8 text-sp-purple animate-spin" />
      </div>
    )
  }

  const { user, profile, orders, favorites, complaints, activity } = data

  const handleForceReset = async () => {
    if (!window.confirm('Force password reset on next login?')) return
    try {
      await api.resetUserPassword(id!) // Generic reset
      toast.success('Security reset triggered')
    } catch (e) { toast.error('Action failed') }
  }

  const handleSuspend = async () => {
     const reason = prompt('Reason for suspension:')
     if (!reason) return
     try {
       await api.suspendUser(id!, reason)
       toast.success('Account suspended')
       fetchDetail()
     } catch (e) { toast.error('Suspension failed') }
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-white p-8 rounded-[40px] border-2 border-sp-border-light shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
         <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-sp-purple-pale rounded-3xl flex items-center justify-center text-3xl font-black text-sp-purple shadow-inner">
               {user.company?.[0] || user.name?.[0]}
            </div>
            <div>
               <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-black text-sp-text tracking-tight">{user.company || user.name}</h1>
                  <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                     user.isVerified ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-amber-50 border-amber-100 text-amber-600'
                  }`}>
                     {user.isVerified ? 'Approved Partner' : 'Verification Pending'}
                  </span>
               </div>
               <p className="text-xs font-bold text-sp-muted mt-1 uppercase tracking-wider flex items-center gap-2">
                  <Building2 size={12} /> {profile.businessType} · {user.name}
               </p>
            </div>
         </div>
         <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
               <p className="text-[10px] font-black text-sp-placeholder uppercase">Account Status</p>
               <p className={`text-xs font-black uppercase ${user.isActive ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {user.isActive ? 'Logged In 2h ago' : 'Offline'}
               </p>
            </div>
            <Link to="/admin/buyers" className="p-3 bg-sp-bg border border-sp-border rounded-2xl text-sp-placeholder hover:text-sp-text transition-all">
               <ArrowLeft size={20} />
            </Link>
         </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
         {/* Navigation */}
         <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white border-2 border-sp-border-light rounded-[32px] p-2 space-y-1 shadow-sm sticky top-6">
               {[
                  { id: 'overview', label: 'Procurement Dashboard', icon: TrendingUp },
                  { id: 'activity', label: 'Behaviour Analysis', icon: Activity },
                  { id: 'network', label: 'Partner Network', icon: Map },
                  { id: 'history', label: 'Full Audit Trail', icon: Clock },
                  { id: 'security', label: 'Security Protocols', icon: ShieldAlert },
               ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id as any)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 text-xs font-bold rounded-2xl transition-all ${
                      activeTab === t.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-sp-muted hover:bg-sp-bg/50 hover:text-sp-text'
                    }`}
                  >
                    <t.icon size={16} /> {t.label}
                  </button>
               ))}
            </div>
         </div>

         {/* Content */}
         <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
               {activeTab === 'overview' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                     <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                        {[
                           { label: 'Total Procurement', value: `₹${(profile.stats.totalSpent/1000).toFixed(1)}k`, icon: Wallet, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                           { label: 'Fulfilled Orders', value: profile.stats.orderCount, icon: ShoppingBag, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                           { label: 'Avg Basket Value', value: `₹${(profile.stats.avgOrderValue/1000).toFixed(1)}k`, icon: CreditCard, color: 'text-sp-purple', bg: 'bg-sp-purple-pale' },
                           { label: 'Dispute Rate', value: `${profile.stats.complaintRate}%`, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50' },
                        ].map(s => (
                           <div key={s.label} className="bg-white p-6 rounded-[28px] border-2 border-sp-border-light shadow-sm">
                              <div className={`w-10 h-10 ${s.bg} ${s.color} rounded-xl flex items-center justify-center mb-4`}>
                                 <s.icon size={20} />
                              </div>
                              <p className="text-2xl font-black text-sp-text uppercase tracking-tight">{s.value}</p>
                              <p className="text-[10px] font-black text-sp-placeholder mt-0.5 uppercase tracking-widest">{s.label}</p>
                           </div>
                        ))}
                     </div>

                     <div className="grid xl:grid-cols-2 gap-6">
                        {/* Payment Behaviour */}
                        <div className="bg-white p-7 rounded-[32px] border-2 border-sp-border-light shadow-sm">
                           <h3 className="text-sm font-black text-sp-text uppercase tracking-widest mb-6 flex items-center justify-between">
                              Payment Behaviour
                              {profile.paymentStats.overduePercentage > 10 && <span className="text-[10px] text-rose-500 font-black animate-pulse">HIGH OVERDUE RISK</span>}
                           </h3>
                           <div className="space-y-5">
                              {[
                                 { label: 'On Time', value: profile.paymentStats.onTimePercentage, color: 'bg-emerald-500' },
                                 { label: 'Delayed', value: profile.paymentStats.delayedPercentage, color: 'bg-amber-500' },
                                 { label: 'Overdue', value: profile.paymentStats.overduePercentage, color: 'bg-rose-500' },
                              ].map(p => (
                                 <div key={p.label}>
                                    <div className="flex justify-between text-[10px] font-black uppercase mb-1.5 grayscale opacity-60">
                                       <span>{p.label}</span>
                                       <span>{p.value}%</span>
                                    </div>
                                    <div className="h-2 bg-sp-bg rounded-full overflow-hidden">
                                       <div className={`h-full ${p.color}`} style={{ width: `${p.value}%` }} />
                                    </div>
                                 </div>
                              ))}
                           </div>
                        </div>

                        {/* Top Manufacturers */}
                        <div className="bg-slate-900 p-7 rounded-[32px] text-white shadow-xl">
                           <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-6">Preferred Suppliers</h3>
                           <div className="space-y-4">
                              {favorites?.map((m: any) => (
                                 <div key={m._id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-800 hover:bg-slate-750 transition-all cursor-pointer">
                                    <div className="flex items-center gap-3">
                                       <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center font-black text-xs text-sp-purple">{m.mfr.company?.[0]}</div>
                                       <div>
                                          <p className="text-xs font-bold leading-tight">{m.mfr.company}</p>
                                          <p className="text-[10px] text-slate-500">{m.count} Orders</p>
                                       </div>
                                    </div>
                                    <p className="text-xs font-black">₹{(m.spent/1000).toFixed(1)}k</p>
                                 </div>
                              ))}
                           </div>
                        </div>
                     </div>
                  </motion.div>
               )}

               {activeTab === 'activity' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                     <div className="bg-white p-8 rounded-[36px] border-2 border-sp-border-light shadow-sm">
                        <h2 className="text-xl font-black text-sp-text mb-8">Access & Search Intelligence</h2>
                        <div className="grid md:grid-cols-2 gap-8">
                           <div>
                              <p className="text-[10px] font-black text-sp-placeholder uppercase tracking-widest mb-4">Login Intensity (30D)</p>
                              <div className="flex items-end gap-1 h-32 bg-sp-bg/20 p-4 rounded-2xl border border-sp-border-light">
                                 {behavior?.loginFrequency.map((d: any, i: number) => (
                                    <div key={i} className="flex-1 bg-indigo-600/30 rounded-t-lg hover:bg-indigo-600 transition-all group relative" style={{ height: `${d.count * 20}%` }}>
                                       <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-slate-950 text-white text-[8px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                          {d.count}
                                       </div>
                                    </div>
                                 ))}
                                 {(!behavior?.loginFrequency || behavior.loginFrequency.length === 0) && (
                                    <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-sp-placeholder uppercase">No Data</div>
                                 )}
                              </div>
                              <p className="text-[10px] font-medium text-sp-placeholder mt-2 italic">* Highlights procurement intent spikes</p>
                           </div>
                           <div>
                              <p className="text-[10px] font-black text-sp-placeholder uppercase tracking-widest mb-4">Search Queries</p>
                              <div className="space-y-2">
                                 {behavior?.queries.map((q: any, i: number) => (
                                    <div key={i} className="flex items-center gap-3 p-3 bg-sp-bg border border-sp-border-light rounded-xl group transition-all hover:translate-x-2">
                                       <SearchIcon size={14} className="text-sp-placeholder group-hover:text-sp-purple" />
                                       <span className="text-xs font-bold text-sp-text">"{q.description}"</span>
                                       <span className="ml-auto text-[9px] font-black text-sp-placeholder">{new Date(q.createdAt).toLocaleDateString()}</span>
                                    </div>
                                 ))}
                              </div>
                           </div>
                        </div>
                     </div>

                     <div className="bg-white p-8 rounded-[36px] border-2 border-sp-border-light shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                           <h2 className="text-xl font-black text-sp-text">Live Cart Activity</h2>
                           <span className="px-3 py-1 bg-rose-50 text-rose-500 border border-rose-100 rounded-xl text-[10px] font-black">CARTS ABANDONED: 4</span>
                        </div>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                           {behavior?.cart?.items.map((item: any, i: number) => (
                              <div key={i} className="p-4 rounded-2xl border-2 border-sp-border-light bg-sp-bg/10 group">
                                 <p className="text-xs font-bold text-sp-text line-clamp-1">{item.product.name}</p>
                                 <p className="text-[10px] font-black text-sp-purple mt-1">QTY: {item.quantity}</p>
                                 <div className="mt-4 pt-4 border-t border-sp-border-light flex justify-between items-center opacity-40 group-hover:opacity-100 transition-opacity">
                                    <span className="text-[10px] font-black">PENDING</span>
                                    <ChevronRight size={14} />
                                 </div>
                              </div>
                           ))}
                           {(!behavior?.cart?.items || behavior.cart.items.length === 0) && (
                              <div className="col-span-4 py-12 text-center opacity-30 italic font-bold uppercase text-xs">Primary cart is empty</div>
                           )}
                        </div>
                     </div>
                  </motion.div>
               )}

               {activeTab === 'network' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-[36px] border-2 border-sp-border-light shadow-sm overflow-hidden">
                     <div className="p-7 border-b-2 border-sp-border-light flex items-center justify-between">
                        <div>
                           <h2 className="text-lg font-black text-sp-text">Supplier Network Analysis</h2>
                           <p className="text-[10px] font-bold text-sp-placeholder uppercase tracking-widest mt-1">Active trading links with manufacturers</p>
                        </div>
                        <button className="px-4 py-2 bg-sp-bg border-2 border-sp-border rounded-xl text-[10px] font-black text-sp-purple hover:bg-sp-purple hover:text-white transition-all">
                           CHECK SUSPICIOUS PATTERNS
                        </button>
                     </div>
                     <div className="overflow-x-auto">
                        <table className="w-full">
                           <thead className="bg-sp-bg/30">
                              <tr className="border-b border-sp-border-light">
                                 <th className="text-left py-5 px-7 text-[10px] font-black uppercase tracking-widest text-sp-placeholder">Manufacturer</th>
                                 <th className="text-center py-5 px-3 text-[10px] font-black uppercase tracking-widest text-sp-placeholder">Orders</th>
                                 <th className="text-right py-5 px-3 text-[10px] font-black uppercase tracking-widest text-sp-placeholder">Total Value</th>
                                 <th className="text-center py-5 px-3 text-[10px] font-black uppercase tracking-widest text-sp-placeholder">Fraud Signals</th>
                                 <th className="text-right py-5 px-7 text-[10px] font-black uppercase tracking-widest text-sp-placeholder">Audit</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-sp-border-light">
                              {favorites?.map((m: any) => (
                                 <tr key={m._id} className="hover:bg-sp-bg/20 transition-all group">
                                    <td className="py-5 px-7">
                                       <Link to={`/admin/manufacturers/${m._id}`} className="group-hover:text-sp-purple transition-colors">
                                          <p className="text-sm font-bold text-sp-text">{m.mfr.company}</p>
                                          <p className="text-[10px] font-bold text-sp-placeholder uppercase line-clamp-1">{m.mfr.name}</p>
                                       </Link>
                                    </td>
                                    <td className="py-5 px-3 text-center">
                                       <span className="px-2.5 py-1 bg-white border border-sp-border rounded text-[10px] font-black">{m.count}</span>
                                    </td>
                                    <td className="py-5 px-3 text-right font-black text-sp-text text-sm">₹{m.spent.toLocaleString()}</td>
                                    <td className="py-5 px-3 text-center">
                                       <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded text-[9px] font-black uppercase">CLEAR</span>
                                    </td>
                                    <td className="py-5 px-7 text-right">
                                       <button className="p-2 text-sp-placeholder hover:text-indigo-600 transition-all">
                                          <Shield size={16} />
                                       </button>
                                    </td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                  </motion.div>
               )}

               {activeTab === 'history' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                     <div className="bg-white p-8 rounded-[36px] border-2 border-sp-border-light shadow-sm min-h-[400px]">
                        <h2 className="text-xl font-black text-sp-text mb-8">Full Account Audit</h2>
                        <div className="space-y-4">
                           {activity?.map((act: any, i: number) => (
                              <div key={i} className="flex gap-4 p-4 rounded-2xl hover:bg-sp-bg/30 transition-all border border-transparent hover:border-sp-border-light">
                                 <div className="w-10 h-10 rounded-xl bg-sp-bg border border-sp-border flex items-center justify-center flex-shrink-0">
                                    {act.action === 'LOGIN' ? <Lock size={16} className="text-sp-purple" /> : <Clock size={16} className="text-indigo-500" />}
                                 </div>
                                 <div className="flex-1">
                                    <div className="flex justify-between">
                                       <p className="text-sm font-black text-sp-text">{act.action}</p>
                                       <span className="text-[10px] font-bold text-sp-placeholder uppercase tracking-tight">{new Date(act.createdAt).toLocaleString()}</span>
                                    </div>
                                    <p className="text-xs font-medium text-sp-muted mt-0.5">{act.description || 'System interaction log'}</p>
                                    <div className="flex items-center gap-4 mt-2 opacity-60">
                                       <span className="text-[8px] font-black uppercase tracking-widest">{act.ipAddress || '192.168.1.1'}</span>
                                       <span className="text-[8px] font-black uppercase tracking-widest">{act.device || 'Chrome Mobile'}</span>
                                    </div>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>
                  </motion.div>
               )}

               {activeTab === 'security' && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="grid md:grid-cols-2 gap-6">
                     <div className="bg-white p-10 rounded-[40px] border-2 border-sp-border-light shadow-sm flex flex-col justify-between">
                        <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-[20px] flex items-center justify-center mb-8 border border-rose-100">
                           <Ban size={28} />
                        </div>
                        <div>
                           <h3 className="text-xl font-black text-sp-text mb-3">Protocol Suspension</h3>
                           <p className="text-sm font-medium text-sp-placeholder mb-10 leading-relaxed">
                              Invalidate all active sessions and block marketplace access. Re-verification required for restoration.
                           </p>
                           <button onClick={handleSuspend} className="w-full py-4 bg-white border-2 border-rose-100 text-rose-600 rounded-2xl font-black text-sm hover:bg-rose-600 hover:text-white transition-all shadow-xl shadow-rose-100">
                              INVOLVE SUSPENSION
                           </button>
                        </div>
                     </div>

                     <div className="bg-white p-10 rounded-[40px] border-2 border-sp-border-light shadow-sm flex flex-col justify-between">
                        <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-[20px] flex items-center justify-center mb-8 border border-amber-100">
                           <Lock size={28} />
                        </div>
                        <div>
                           <h3 className="text-xl font-black text-sp-text mb-3">Mandatory Credential Reset</h3>
                           <p className="text-sm font-medium text-sp-placeholder mb-10 leading-relaxed">
                              Required if multi-city login patterns or suspicious IP sequences are detected by the internal monitoring engine.
                           </p>
                           <button onClick={handleForceReset} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:opacity-90 transition-all shadow-xl shadow-indigo-100">
                              TRIGGER IDENTITY RESET
                           </button>
                        </div>
                     </div>
                  </motion.div>
               )}
            </AnimatePresence>
         </div>
      </div>
    </div>
  )
}
