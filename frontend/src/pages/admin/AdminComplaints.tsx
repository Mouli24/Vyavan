import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/lib/api'
import { 
  AlertCircle, Gavel, ShieldAlert, Clock, User, 
  Building2, ChevronRight, BarChart3, Filter, 
  Search, Info, ArrowUpRight, TrendingUp, AlertTriangle,
  Loader, CheckCircle2, MessageSquare
} from 'lucide-react'
import { motion } from 'motion/react'
import toast from 'react-hot-toast'

export default function AdminComplaints() {
  const [list, setList] = useState<any[]>([])
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'ESCALATED' | 'RESOLVED' | 'PENDING'>('ESCALATED')

  const fetchData = async () => {
    setLoading(true)
    try {
      const [res, stats] = await Promise.all([
        api.getAdminComplaints({ status: activeTab }),
        api.getDisputeAnalytics()
      ])
      setList(res.data)
      setAnalytics(stats)
    } catch (e) {
      toast.error('Failed to load disputes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [activeTab])

  const getSlaInfo = (date: string) => {
     const days = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24))
     if (days > 7) return { label: `${days}D PENDING`, color: 'text-rose-600', bg: 'bg-rose-50' }
     return { label: `${days}D PENDING`, color: 'text-amber-600', bg: 'bg-amber-50' }
  }

  return (
    <div className="space-y-8">
      {/* Analytics Hero */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="lg:col-span-2 bg-slate-900 p-10 rounded-[48px] text-white relative overflow-hidden">
            <div className="relative z-10">
               <h1 className="text-3xl font-black tracking-tight flex items-center gap-4">
                  Dispute Resolution Center
                  <Gavel className="text-indigo-500 animate-pulse" size={32} />
               </h1>
               <p className="text-slate-400 font-medium mt-2 max-w-sm">
                  Tribunal-grade intervention engine resolving transactional conflicts across the platform ecosystem.
               </p>
               
               <div className="grid grid-cols-2 md:grid-cols-3 gap-8 mt-10">
                  <div className="space-y-1">
                     <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Escalations</p>
                     <p className="text-3xl font-black text-rose-500">{list.length}</p>
                  </div>
                  {analytics?.resolutionStats?.map((s: any) => (
                     <div key={s._id} className="space-y-1">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{s._id.replace(/_/g, ' ')}</p>
                        <p className="text-3xl font-black text-indigo-400">{s.count}</p>
                     </div>
                  ))}
               </div>
            </div>
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2" />
         </div>

         {/* Ranking Card */}
         <div className="bg-white p-8 rounded-[40px] border-2 border-sp-border-light shadow-sm">
            <h3 className="text-xs font-black text-sp-placeholder uppercase tracking-widest mb-6 flex items-center gap-2">
               <ShieldAlert size={14} className="text-rose-500" /> High Friction Nodes
            </h3>
            <div className="space-y-4">
               {analytics?.ranking?.map((m: any, i: number) => (
                  <div key={m._id} className="flex items-center justify-between p-3 bg-sp-bg/50 rounded-2xl border border-sp-border-light hover:border-rose-200 transition-all cursor-pointer group">
                     <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center">{i+1}</span>
                        <p className="text-[11px] font-bold text-sp-text truncate max-w-[120px]">{m.mfr.company}</p>
                     </div>
                     <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-1 rounded-lg border border-rose-100">{m.count} DISPUTES</span>
                  </div>
               ))}
            </div>
         </div>
      </div>

      {/* Control Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-white border-2 border-sp-border-light w-fit rounded-[24px]">
         <button onClick={() => setActiveTab('ESCALATED')} className={`px-6 py-3 rounded-[18px] text-xs font-black uppercase transition-all ${activeTab === 'ESCALATED' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-sp-placeholder hover:text-sp-text'}`}>Tribunal Feed</button>
         <button onClick={() => setActiveTab('RESOLVED')} className={`px-6 py-3 rounded-[18px] text-xs font-black uppercase transition-all ${activeTab === 'RESOLVED' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-sp-placeholder hover:text-sp-text'}`}>Archived Resolutions</button>
         <button onClick={() => setActiveTab('PENDING')} className={`px-6 py-3 rounded-[18px] text-xs font-black uppercase transition-all ${activeTab === 'PENDING' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-sp-placeholder hover:text-sp-text'}`}>Standard Complaints</button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
         {loading ? (
            <div className="col-span-full py-20 text-center"><Loader size={32} className="text-indigo-600 animate-spin mx-auto" /></div>
         ) : list.length === 0 ? (
            <div className="col-span-full py-24 text-center bg-white rounded-[48px] border-2 border-dashed border-sp-border-light">
               <CheckCircle2 size={56} className="text-emerald-500 mx-auto mb-6" />
               <h3 className="text-xl font-black text-sp-text uppercase tracking-tight">Perimeter Secure</h3>
               <p className="text-sm font-medium text-sp-placeholder mt-2 uppercase tracking-wide">No unresolved disputes detected in the active segment</p>
            </div>
         ) : (
            list.map(c => {
               const sla = getSlaInfo(c.updatedAt)
               return (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={c._id} className="bg-white rounded-[40px] border-2 border-sp-border-light shadow-sm overflow-hidden flex flex-col group hover:border-indigo-200 transition-all">
                     <div className="p-7 border-b-2 border-sp-border-light flex items-center justify-between">
                        <div className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest ${sla.bg} ${sla.color}`}>
                           {sla.label}
                        </div>
                        <span className="text-[10px] font-black text-sp-placeholder uppercase tracking-widest">REF: {c.complaintId}</span>
                     </div>
                     
                     <div className="p-7 flex-1 space-y-6">
                        <div>
                           <h3 className="text-lg font-black text-sp-text leading-tight group-hover:text-indigo-600 transition-colors">{c.title}</h3>
                           <p className="text-xs font-bold text-sp-placeholder uppercase mt-2">{c.category || 'Conflict'}</p>
                        </div>
                        
                        <div className="space-y-3">
                           <div className="flex items-center gap-3 p-3 bg-sp-bg rounded-2xl">
                              <div className="w-8 h-8 rounded-lg bg-white border border-sp-border flex items-center justify-center font-black text-[10px] text-sp-purple">B</div>
                              <div>
                                 <p className="text-[10px] font-black text-sp-text leading-none truncate max-w-[140px]">{c.buyer?.company || c.buyer?.name}</p>
                                 <p className="text-[9px] font-bold text-sp-placeholder uppercase mt-1 tracking-tight">Accuser Node</p>
                              </div>
                           </div>
                           <div className="flex items-center gap-3 p-3 bg-indigo-50 border border-indigo-100 rounded-2xl">
                              <div className="w-8 h-8 rounded-lg bg-white border border-indigo-200 flex items-center justify-center font-black text-[10px] text-indigo-500">M</div>
                              <div>
                                 <p className="text-[10px] font-black text-indigo-900 leading-none truncate max-w-[140px]">{c.manufacturer?.company}</p>
                                 <p className="text-[9px] font-bold text-indigo-400 uppercase mt-1 tracking-tight">Respondent Node</p>
                              </div>
                           </div>
                        </div>
                     </div>

                     <div className="px-7 py-6 bg-sp-bg/20 border-t-2 border-sp-border-light">
                        <Link 
                           to={`/admin/complaints/${c._id}/resolution`}
                           className="w-full flex items-center justify-center gap-2 py-4 bg-white border-2 border-sp-border-light rounded-2xl text-[10px] font-black text-sp-text hover:bg-indigo-600 hover:text-white hover:border-transparent transition-all shadow-sm group/btn"
                        >
                           OPEN LITIGATION SUITE
                           <ArrowUpRight size={14} className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                        </Link>
                     </div>
                  </motion.div>
               )
            })
         )}
      </div>
    </div>
  )
}
