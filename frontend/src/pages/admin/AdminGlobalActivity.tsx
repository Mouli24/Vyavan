import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { 
  Activity, Search, Filter, Download as DownloadIcon, 
  Clock, User, ShieldAlert, MapPin, Smartphone, 
  Circle, AlertCircle, Loader, ChevronLeft, ChevronRight,
  ExternalLink, LogIn, ShoppingCart, Settings, Shield
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminGlobalActivity() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [filterUser, setFilterUser] = useState('')
  const [filterAction, setFilterAction] = useState('all')
  const [onlySuspicious, setOnlySuspicious] = useState(false)

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const res = await api.getGlobalActivityLogs({
        page,
        user: filterUser,
        action: filterAction === 'all' ? undefined : filterAction,
        isSuspicious: onlySuspicious
      })
      setLogs(res.data)
      setTotal(res.total)
    } catch (e) {
      toast.error('Failed to load activity logs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => fetchLogs(), 300)
    return () => clearTimeout(timer)
  }, [page, filterUser, filterAction, onlySuspicious])

  const getActionStyles = (action: string) => {
    switch(action) {
      case 'LOGIN': return { icon: <LogIn size={14}/>, color: 'text-indigo-600', bg: 'bg-indigo-50' }
      case 'PLACE_ORDER': return { icon: <ShoppingCart size={14}/>, color: 'text-emerald-600', bg: 'bg-emerald-50' }
      case 'SECURITY_RESET': return { icon: <Shield size={14}/>, color: 'text-amber-600', bg: 'bg-amber-50' }
      case 'FAILED_LOGIN': return { icon: <ShieldAlert size={14}/>, color: 'text-rose-600', bg: 'bg-rose-50' }
      default: return { icon: <Settings size={14}/>, color: 'text-slate-600', bg: 'bg-slate-100' }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-2xl font-black text-sp-text tracking-tight flex items-center gap-3">
              Operational Logs
              <Activity className="text-sp-purple animate-pulse" size={24} />
           </h1>
           <p className="text-[10px] font-black text-sp-muted uppercase tracking-widest mt-1">Real-time system interaction & security audit trail</p>
        </div>
        <div className="flex items-center gap-2">
           <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all cursor-pointer ${onlySuspicious ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-white border-sp-border-light text-sp-placeholder hover:text-sp-text'}`}
                onClick={() => setOnlySuspicious(!onlySuspicious)}>
              <ShieldAlert size={16} />
              <span className="text-[10px] font-black uppercase">Suspicious Only</span>
           </div>
           <button className="p-2.5 bg-white border border-sp-border rounded-xl text-sp-placeholder hover:text-sp-text transition-all shadow-sm">
              <DownloadIcon size={18} />
           </button>
        </div>
      </div>

      {/* Control Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
         <div className="md:col-span-8 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-sp-placeholder" size={18} />
            <input 
               type="text" 
               placeholder="Search by user name or email..." 
               value={filterUser}
               onChange={e => setFilterUser(e.target.value)}
               className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-sp-border-light rounded-2xl text-sm font-bold text-sp-text focus:outline-none focus:border-sp-purple/20 transition-all shadow-sm"
            />
         </div>
         <div className="md:col-span-4">
            <select 
               value={filterAction}
               onChange={e => setFilterAction(e.target.value)}
               className="w-full px-4 py-3.5 bg-white border-2 border-sp-border-light rounded-2xl text-xs font-black text-sp-text outline-none focus:border-sp-purple/20 shadow-sm uppercase"
            >
               <option value="all">ALL ACTIONS</option>
               <option value="LOGIN">LOGIN EVENTS</option>
               <option value="PLACE_ORDER">ORDER ACTIVITY</option>
               <option value="FAILED_LOGIN">FAILED LOGINS</option>
            </select>
         </div>
      </div>

      {/* Logs List */}
      <div className="bg-white rounded-[40px] border-2 border-sp-border-light shadow-sm overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead className="bg-sp-bg/40">
                  <tr className="border-b border-sp-border-light">
                     <th className="py-5 px-8 text-[10px] font-black uppercase tracking-widest text-sp-placeholder">Event Sequence</th>
                     <th className="py-5 px-3 text-[10px] font-black uppercase tracking-widest text-sp-placeholder">Actor</th>
                     <th className="py-5 px-3 text-[10px] font-black uppercase tracking-widest text-sp-placeholder">System Action</th>
                     <th className="py-5 px-3 text-[10px] font-black uppercase tracking-widest text-sp-placeholder">Intelligence</th>
                     <th className="py-5 px-8 text-right text-[10px] font-black uppercase tracking-widest text-sp-placeholder">Reference</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-sp-border-light">
                  {loading ? (
                     <tr><td colSpan={5} className="py-20 text-center"><Loader className="w-8 h-8 text-sp-purple animate-spin mx-auto" /></td></tr>
                  ) : logs.length === 0 ? (
                     <tr><td colSpan={5} className="py-20 text-center text-xs font-black text-sp-placeholder uppercase italic">No incidents recorded in this view</td></tr>
                  ) : (
                     logs.map((log, i) => {
                        const style = getActionStyles(log.action)
                        return (
                           <tr key={log._id} className="hover:bg-sp-bg/20 transition-all group">
                              <td className="py-5 px-8">
                                 <div className="flex items-center gap-4">
                                    <div className="flex flex-col items-center">
                                       <div className={`w-1 h-1 rounded-full ${log.isSuspicious ? 'bg-rose-500' : 'bg-sp-purple'}`} />
                                       <div className="w-0.5 h-6 bg-sp-border-light" />
                                    </div>
                                    <div className="leading-none">
                                       <p className="text-xs font-black text-sp-text">{new Date(log.createdAt).toLocaleTimeString()}</p>
                                       <p className="text-[9px] font-bold text-sp-placeholder mt-0.5">{new Date(log.createdAt).toLocaleDateString()}</p>
                                    </div>
                                 </div>
                              </td>
                              <td className="py-5 px-3">
                                 <div className="flex items-center gap-3">
                                    <div className="w-7 h-7 bg-sp-bg rounded-lg flex items-center justify-center font-black text-[10px] text-sp-placeholder group-hover:bg-sp-purple group-hover:text-white transition-all">
                                       {log.user?.name?.[0]}
                                    </div>
                                    <div>
                                       <p className="text-xs font-black text-sp-text">{log.user?.email}</p>
                                       <p className="text-[9px] font-bold text-sp-placeholder uppercase mt-0.5">{log.user?.role} · {log.user?.company || 'N/A'}</p>
                                    </div>
                                 </div>
                              </td>
                              <td className="py-5 px-3">
                                 <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg ${style.bg} ${style.color} border border-current/10`}>
                                    {style.icon}
                                    <span className="text-[9px] font-black uppercase tracking-tighter">{log.action}</span>
                                 </div>
                              </td>
                              <td className="py-5 px-3">
                                 <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-sp-placeholder uppercase">
                                       <MapPin size={10} /> {log.location || 'Mumbai, IN'}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-sp-placeholder uppercase">
                                       <Smartphone size={10} /> {log.device || 'Chrome, Windows'}
                                    </div>
                                 </div>
                              </td>
                              <td className="py-5 px-8 text-right">
                                 <button className="p-2 text-sp-placeholder hover:text-sp-purple transition-all group-hover:scale-110">
                                    <ExternalLink size={14} />
                                 </button>
                              </td>
                           </tr>
                        )
                     })
                  )}
               </tbody>
            </table>
         </div>

         {/* Pagination */}
         <div className="p-6 border-t-2 border-sp-border-light flex items-center justify-between bg-sp-bg/5">
            <p className="text-[10px] font-black text-sp-placeholder uppercase tracking-widest leading-none">Global Event Count: {total}</p>
            <div className="flex items-center gap-2">
               <button 
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="w-10 h-10 bg-white border border-sp-border rounded-xl flex items-center justify-center text-sp-placeholder hover:text-sp-text disabled:opacity-30 transition-all shadow-sm"
               >
                  <ChevronLeft size={18} />
               </button>
               <span className="px-4 py-2 bg-sp-bg rounded-lg text-xs font-black text-sp-purple">{page}</span>
               <button 
                  disabled={page * 50 >= total}
                  onClick={() => setPage(p => p + 1)}
                  className="w-10 h-10 bg-white border border-sp-border rounded-xl flex items-center justify-center text-sp-placeholder hover:text-sp-text disabled:opacity-30 transition-all shadow-sm"
               >
                  <ChevronRight size={18} />
               </button>
            </div>
         </div>
      </div>
    </div>
  )
}
