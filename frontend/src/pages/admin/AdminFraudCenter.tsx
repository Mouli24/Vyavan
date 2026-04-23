import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { motion, AnimatePresence } from 'motion/react'
import { 
  ShieldAlert, ShieldCheck, AlertTriangle, AlertCircle, 
  Search, Filter, RefreshCw, Eye, CheckCircle, XCircle,
  Loader, Clock, User, Shield, Info, ArrowRight,
  MoreVertical, Ban, Trash2, Zap, MessageSquare, Star
} from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function AdminFraudCenter() {
  const [flags, setFlags] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active')
  const [selectedFlag, setSelectedFlag] = useState<any>(null)
  const [resolutionNote, setResolutionNote] = useState('')

  const fetchFlags = async () => {
    setLoading(true)
    try {
      const data = await api.getSystemFlags({ status: activeTab })
      setFlags(data)
    } catch (e) {
      toast.error('Failed to load risk feed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFlags()
  }, [activeTab])

  const handleManualScan = async () => {
    setScanning(true)
    try {
      const res = await api.runFraudScan()
      toast.success(`Scan complete! Found ${res.newFlagsCount} new risks.`)
      fetchFlags()
    } catch (e) {
      toast.error('Automated scan failed')
    } finally {
      setScanning(false)
    }
  }

  const handleResolve = async (status: 'resolved' | 'dismissed') => {
    if (!resolutionNote.trim()) return
    try {
      await api.resolveFlag(selectedFlag._id, { status, note: resolutionNote })
      setFlags(flags.filter(f => f._id !== selectedFlag._id))
      setSelectedFlag(null)
      setResolutionNote('')
      toast.success(`Flag ${status} successfully`)
    } catch (e) {
      toast.error('Resolution failed')
    }
  }

  const getSeverityStyles = (severity: string) => {
    switch(severity) {
      case 'Critical': return 'bg-rose-500 text-white border-rose-600 shadow-rose-200'
      case 'High': return 'bg-orange-500 text-white border-orange-600 shadow-orange-200'
      case 'Medium': return 'bg-amber-400 text-slate-900 border-amber-500 shadow-amber-100'
      default: return 'bg-slate-100 text-slate-600 border-slate-200'
    }
  }

  const getFlagIcon = (type: string) => {
    switch(type) {
      case 'DUPLICATE_IP': return <Zap size={20} />
      case 'MESSAGE_SPAM': return <MessageSquare size={20} />
      case 'FAKE_REVIEW': return <Star size={20} />
      case 'GST_REUSE': return <Shield size={20} />
      default: return <AlertTriangle size={20} />
    }
  }

  return (
    <div className="space-y-6">
      {/* Risk Banner */}
      <div className="bg-slate-950 p-10 rounded-[48px] text-white relative overflow-hidden">
         <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
               <div>
                  <h1 className="text-3xl font-black tracking-tight flex items-center gap-4">
                     Fraud Control Center
                     <ShieldAlert className="text-rose-500 animate-pulse" size={32} />
                  </h1>
                  <p className="text-slate-400 font-medium mt-2 max-w-lg">
                     Real-time threat intelligence engine monitoring marketplace traffic patterns, identity duplication, and behavioral outliers.
                  </p>
               </div>
               <div className="flex items-center gap-3">
                  <div className="px-6 py-4 bg-slate-900 border border-slate-800 rounded-3xl text-center">
                     <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Active Risks</p>
                     <p className="text-2xl font-black text-rose-500">{flags.filter(f => f.severity === 'Critical' || f.severity === 'High').length}</p>
                  </div>
                  <button 
                     onClick={handleManualScan}
                     disabled={scanning}
                     className="flex items-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 transition-all rounded-[24px] font-black text-sm disabled:opacity-50 shadow-xl shadow-indigo-900/40"
                  >
                     {scanning ? <RefreshCw className="animate-spin" size={18} /> : <Zap size={18} />}
                     TRIGGER SECURITY SCAN
                  </button>
               </div>
            </div>
         </div>
         <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/4" />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-white border-2 border-sp-border-light w-fit rounded-[24px]">
         <button onClick={() => setActiveTab('active')} className={`px-6 py-3 rounded-[18px] text-xs font-black uppercase transition-all ${activeTab === 'active' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-sp-placeholder hover:text-sp-text'}`}>Risk Feed</button>
         <button onClick={() => setActiveTab('history')} className={`px-6 py-3 rounded-[18px] text-xs font-black uppercase transition-all ${activeTab === 'history' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-sp-placeholder hover:text-sp-text'}`}>Audit History</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
         {loading ? (
            <div className="col-span-full py-20 text-center"><Loader size={32} className="text-indigo-600 animate-spin mx-auto" /></div>
         ) : flags.length === 0 ? (
            <div className="col-span-full py-24 text-center bg-white rounded-[48px] border-2 border-dashed border-sp-border-light">
               <ShieldCheck size={56} className="text-emerald-500 mx-auto mb-6" />
               <h3 className="text-xl font-black text-sp-text uppercase">Security Perimeter Clear</h3>
               <p className="text-sm font-medium text-sp-placeholder mt-2 uppercase tracking-wide">No behavioral risks detected in the current sequence</p>
            </div>
         ) : (
            flags.map(flag => (
               <motion.div 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }}
                  key={flag._id} 
                  className="bg-white rounded-[40px] border-2 border-sp-border-light shadow-sm overflow-hidden flex flex-col group hover:border-slate-300 transition-all"
               >
                  <div className="p-7 border-b-2 border-sp-border-light flex items-center justify-between">
                     <div className={`p-3 rounded-2xl border ${getSeverityStyles(flag.severity)} shadow-sm`}>
                        {getFlagIcon(flag.flagType)}
                     </div>
                     <span className="text-[10px] font-black text-sp-placeholder uppercase tracking-widest">{format(new Date(flag.createdAt), 'MMM dd, HH:mm')}</span>
                  </div>
                  
                  <div className="p-7 flex-1">
                     <h3 className="text-lg font-black text-sp-text uppercase tracking-tight mb-2">{flag.flagType.replace(/_/g, ' ')}</h3>
                     <p className="text-xs font-bold text-sp-placeholder leading-relaxed mb-6">{flag.evidence.description}</p>
                     
                     <div className="space-y-3">
                        {flag.subjectUser && (
                           <div className="p-3 bg-sp-bg rounded-2xl flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-white border border-sp-border flex items-center justify-center font-black text-[10px] text-sp-purple">{flag.subjectUser.name[0]}</div>
                              <div>
                                 <p className="text-[10px] font-black text-sp-text leading-none">{flag.subjectUser.company || flag.subjectUser.name}</p>
                                 <p className="text-[9px] font-bold text-sp-placeholder uppercase tracking-tight mt-1">{flag.subjectUser.role}</p>
                              </div>
                           </div>
                        )}
                        {flag.involvedUsers?.slice(0, 2).map((u: any) => (
                           <div key={u._id} className="p-3 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-white border border-rose-200 flex items-center justify-center font-black text-[10px] text-rose-500">{u.name[0]}</div>
                              <div>
                                 <p className="text-[10px] font-black text-rose-700 leading-none">{u.company || u.name}</p>
                                 <p className="text-[9px] font-bold text-rose-400 uppercase tracking-tight mt-1">Associated Node</p>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>

                  <div className="px-7 py-6 bg-sp-bg/20 border-t-2 border-sp-border-light">
                     {activeTab === 'active' ? (
                        <button 
                           onClick={() => setSelectedFlag(flag)}
                           className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase hover:opacity-90 transition-all shadow-lg shadow-indigo-100"
                        >
                           INTERVENE & RESOLVE
                        </button>
                     ) : (
                        <div className="flex items-center gap-3">
                           <div className={`p-2 rounded-xl ${flag.status === 'resolved' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                              {flag.status === 'resolved' ? <CheckCircle size={16}/> : <XCircle size={16}/>}
                           </div>
                           <p className="text-[10px] font-black uppercase text-sp-placeholder">{flag.status} by Admin</p>
                        </div>
                     )}
                  </div>
               </motion.div>
            ))
         )}
      </div>

      {/* Resolution Modal */}
      {selectedFlag && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[48px] p-12 w-full max-w-lg shadow-2xl relative">
               <button onClick={() => setSelectedFlag(null)} className="absolute top-8 right-8 text-sp-placeholder hover:text-sp-text"><XCircle size={24}/></button>
               
               <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 bg-indigo-50 border-2 border-indigo-100 rounded-3xl flex items-center justify-center text-indigo-600">
                     <AlertCircle size={28} />
                  </div>
                  <div>
                     <h3 className="text-xl font-black text-sp-text uppercase tracking-tight">Pattern Intervention</h3>
                     <p className="text-[10px] font-black text-sp-placeholder uppercase tracking-widest mt-1">Audit Reference: {selectedFlag._id}</p>
                  </div>
               </div>

               <p className="text-sm font-medium text-sp-placeholder mb-8 leading-relaxed uppercase tracking-wide">
                  Document the rationale for managing this security flag. This will be stored for audit purposes.
               </p>

               <textarea 
                  className="w-full p-6 bg-sp-bg border-4 border-transparent rounded-[32px] text-sm font-medium resize-none focus:outline-none focus:border-indigo-600/5 focus:ring-4 focus:ring-indigo-600/5 transition-all text-sp-text placeholder:text-sp-placeholder"
                  rows={4}
                  placeholder="e.g., Genuince case of branch offices sharing IP, or Confirmed identity theft pattern..."
                  value={resolutionNote}
                  onChange={e => setResolutionNote(e.target.value)}
               />

               <div className="flex gap-4 mt-8">
                  <button 
                     onClick={() => handleResolve('dismissed')}
                     className="flex-1 py-4 bg-white border-2 border-sp-border text-sp-muted font-black rounded-2xl text-xs hover:bg-sp-bg transition-all uppercase tracking-widest"
                  >
                     Dismiss Risk
                  </button>
                  <button 
                     onClick={() => handleResolve('resolved')}
                     disabled={!resolutionNote.trim()}
                     className="flex-1 py-4 bg-emerald-600 text-white font-black rounded-2xl text-xs hover:opacity-90 disabled:opacity-50 transition-all shadow-xl shadow-emerald-200 uppercase tracking-widest"
                  >
                     Mark Resolved
                  </button>
               </div>
            </motion.div>
         </div>
      )}
    </div>
  )
}
