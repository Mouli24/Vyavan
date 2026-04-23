import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { 
  Gavel, ArrowLeft, ShieldAlert, CheckCircle, 
  XCircle, AlertTriangle, User, Building2, 
  Clock, FileText, ExternalLink, Scale, 
  DollarSign, Loader, Shield, History, Info,
  Package, MapPin, Truck
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import toast from 'react-hot-toast'

export default function AdminDisputeResolution() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [decision, setDecision] = useState<'FAVOUR_BUYER' | 'FAVOUR_MANUFACTURER' | 'PARTIAL_REFUND' | 'BOTH_AT_FAULT' | ''>('')
  const [refundAmount, setRefundAmount] = useState(0)
  const [adminNote, setAdminNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchDispute = async () => {
    try {
      const res = await api.getDisputeDetail(id!)
      setData(res)
      if (res.complaint.resolution?.decision !== 'PENDING') {
         setDecision(res.complaint.resolution.decision)
         setRefundAmount(res.complaint.resolution.refundAmount)
         setAdminNote(res.complaint.resolution.adminNote)
      }
    } catch (e) { toast.error('Failed to load litigation data') }
    finally { setLoading(false) }
  }

  useEffect(() => { if (id) fetchDispute() }, [id])

  const handleResolve = async () => {
    if (!decision || !adminNote.trim()) {
       toast.error('Decision and internal rationale are mandatory')
       return
    }
    setSubmitting(true)
    try {
       await api.resolveDispute(id!, { decision, refundAmount, adminNote })
       toast.success('Litigation closed. Parties notified.')
       navigate('/admin/complaints')
    } catch (e) { toast.error('Resolution failed to transmit') }
    finally { setSubmitting(false) }
  }

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader size={32} className="text-indigo-600 animate-spin" /></div>

  const { complaint, order } = data

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin/complaints" className="p-3 bg-white border border-sp-border rounded-xl text-sp-placeholder hover:text-sp-text transition-all shadow-sm">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-sp-text tracking-tight flex items-center gap-3 uppercase">
              Litigation Suite
              <span className="text-rose-600">#{complaint.complaintId}</span>
            </h1>
            <p className="text-[10px] font-black text-sp-muted uppercase tracking-widest mt-1">Formal Administrative Intervention Sequence</p>
          </div>
        </div>
        <div className={`px-4 py-2 rounded-xl border font-black text-[10px] uppercase tracking-widest ${complaint.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100 animate-pulse'}`}>
           {complaint.status}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Left Panel: Accuser Evidence */}
         <div className="bg-white rounded-[40px] border-2 border-sp-border-light shadow-sm overflow-hidden flex flex-col">
            <div className="p-7 border-b-2 border-sp-border-light bg-indigo-50/30 flex items-center justify-between">
               <h3 className="text-sm font-black text-sp-text uppercase tracking-widest flex items-center gap-3">
                  <User className="text-indigo-600" size={18} />
                  Accuser Statement
               </h3>
               <span className="text-[10px] font-black text-sp-purple bg-white px-3 py-1 rounded-lg border border-sp-border">BUYER SIDE</span>
            </div>
            <div className="p-7 flex-1 space-y-6">
               <div>
                  <label className="text-[10px] font-black text-sp-placeholder uppercase tracking-widest mb-2 block">Incident Description</label>
                  <div className="bg-sp-bg/50 p-6 rounded-[28px] text-sm font-medium text-sp-text leading-relaxed border border-sp-border-light italic">
                     “{complaint.description}”
                  </div>
               </div>
               
               {complaint.evidence?.length > 0 && (
                  <div>
                     <label className="text-[10px] font-black text-sp-placeholder uppercase tracking-widest mb-4 block">Visual Evidence Repository</label>
                     <div className="grid grid-cols-3 gap-3">
                        {complaint.evidence.map((img: string, i: number) => (
                           <a key={i} href={img} target="_blank" rel="noreferrer" className="aspect-square bg-sp-bg rounded-2xl border-2 border-sp-border-light overflow-hidden group relative">
                              <img src={img} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                 <ExternalLink className="text-white" size={20} />
                              </div>
                           </a>
                        ))}
                     </div>
                  </div>
               )}
            </div>
         </div>

         {/* Right Panel: Respondent Evidence */}
         <div className="bg-slate-900 rounded-[40px] shadow-xl overflow-hidden flex flex-col text-white">
            <div className="p-7 border-b border-slate-800 bg-slate-800/30 flex items-center justify-between">
               <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-3">
                  <Building2 size={18} />
                  Respondent Rebuttal
               </h3>
               <span className="text-[10px] font-black text-slate-500 bg-slate-800 px-3 py-1 rounded-lg border border-slate-700">MANUFACTURER SIDE</span>
            </div>
            <div className="p-7 flex-1 space-y-6">
               <div>
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2 block">Defense Explanation</label>
                  <div className="bg-slate-800/50 p-6 rounded-[28px] text-sm font-medium text-slate-300 leading-relaxed border border-slate-800 italic">
                     {complaint.manufacturerExplanation || complaint.response || 'Respondent has not yet provided a formal statement for this tribunal session.'}
                  </div>
               </div>

               {complaint.manufacturerDocuments?.length > 0 && (
                  <div>
                     <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-4 block">Fulfillment Audit Trails</label>
                     <div className="grid grid-cols-2 gap-4">
                        {complaint.manufacturerDocuments.map((doc: string, i: number) => (
                           <a key={i} href={doc} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-4 bg-slate-800 border border-slate-700 rounded-2xl group hover:border-indigo-500 transition-all">
                              <div className="w-10 h-10 bg-slate-700 text-slate-400 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                 <FileText size={20} />
                              </div>
                              <div className="min-w-0">
                                 <p className="text-[10px] font-black text-slate-300 truncate tracking-tight uppercase">AUDIT_DOC_{i+1}.PDF</p>
                                 <p className="text-[9px] font-bold text-slate-500 whitespace-nowrap">VIEW ATTACHMENT</p>
                              </div>
                           </a>
                        ))}
                     </div>
                  </div>
               )}
            </div>
         </div>

         {/* Bottom Panel: Transaction Timeline */}
         <div className="lg:col-span-2 bg-white rounded-[40px] border-2 border-sp-border-light shadow-sm overflow-hidden">
            <div className="p-7 border-b-2 border-sp-border-light bg-sp-bg/20 flex items-center justify-between">
               <h3 className="text-sm font-black text-sp-text uppercase tracking-widest flex items-center gap-3">
                  <History className="text-sp-purple" size={18} />
                  Sequence Audit: Order #{order?.orderId}
               </h3>
            </div>
            <div className="p-7">
               {order ? (
                  <div className="grid md:grid-cols-3 gap-8">
                     <div className="space-y-6">
                        <div className="p-5 bg-sp-bg rounded-3xl border border-sp-border-light">
                           <p className="text-[10px] font-black text-sp-placeholder uppercase mb-4 tracking-widest">Transaction Summary</p>
                           <div className="space-y-3">
                              <p className="text-xs font-bold text-sp-text flex justify-between">VALUE: <span className="font-black">₹{order.valueRaw?.toLocaleString()}</span></p>
                              <p className="text-xs font-bold text-sp-text flex justify-between">ITEMS: <span className="font-black">{order.items}</span></p>
                              <p className="text-xs font-bold text-emerald-600 flex justify-between">ESCROW: <span className="font-black uppercase">{order.escrowStatus}</span></p>
                           </div>
                        </div>
                     </div>
                     <div className="md:col-span-2">
                        <div className="relative space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-sp-border-light">
                           {order.timeline?.slice(-4).map((t: any, i: number) => (
                              <div key={i} className="relative pl-9 text-slate-900 font-bold">
                                 <div className="absolute left-0 top-1 w-6 h-6 bg-white border-4 border-indigo-600 rounded-full z-10" />
                                 <p className="text-xs font-black uppercase text-sp-text">{t.status}</p>
                                 <p className="text-[10px] text-sp-placeholder mt-0.5">{new Date(t.createdAt).toLocaleString()} — {t.note}</p>
                              </div>
                           ))}
                        </div>
                     </div>
                  </div>
               ) : (
                  <p className="text-sm italic text-sp-placeholder text-center py-10 uppercase font-black">Transactional data not mapped to this litigation ID</p>
               )}
            </div>
         </div>

         {/* Intervention Console */}
         <div className="lg:col-span-2 bg-indigo-600 p-10 rounded-[48px] text-white shadow-2xl relative overflow-hidden">
            <div className="relative z-10">
               <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center text-white">
                     <Scale size={32} />
                  </div>
                  <div>
                     <h3 className="text-2xl font-black tracking-tight uppercase">Tribunal Consensus</h3>
                     <p className="text-indigo-100/60 text-[10px] font-black uppercase tracking-widest">Final Administrative Determination</p>
                  </div>
               </div>

               <div className="grid md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                     <label className="text-[10px] font-black text-indigo-200 uppercase tracking-widest block">Core Decision Model</label>
                     <div className="grid grid-cols-2 gap-3">
                        {[
                           { id: 'FAVOUR_BUYER', label: 'Favour Buyer', icon: User, color: 'hover:bg-emerald-500' },
                           { id: 'FAVOUR_MANUFACTURER', label: 'Favour Mfr', icon: Building2, color: 'hover:bg-blue-500' },
                           { id: 'PARTIAL_REFUND', label: 'Partial Refund', icon: DollarSign, color: 'hover:bg-amber-500' },
                           { id: 'BOTH_AT_FAULT', label: 'Both at Fault', icon: AlertTriangle, color: 'hover:bg-rose-500' }
                        ].map(opt => (
                           <button 
                              key={opt.id}
                              disabled={complaint.status === 'RESOLVED'}
                              onClick={() => setDecision(opt.id as any)}
                              className={`flex flex-col items-center justify-center gap-2 p-5 rounded-3xl border-2 transition-all ${decision === opt.id ? 'bg-white text-indigo-600 border-white shadow-xl' : 'bg-transparent border-white/20 text-white ' + opt.color}`}
                           >
                              <opt.icon size={20} />
                              <span className="text-[10px] font-black uppercase tracking-tighter text-center">{opt.label}</span>
                           </button>
                        ))}
                     </div>

                     {decision === 'PARTIAL_REFUND' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                           <label className="text-[10px] font-black text-indigo-200 uppercase tracking-widest block">Adjustment Amount (₹)</label>
                           <input 
                              type="number" 
                              className="w-full bg-white/10 border-2 border-white/20 rounded-[20px] p-4 text-white font-black text-lg focus:outline-none focus:border-white transition-all"
                              placeholder="0.00"
                              value={refundAmount}
                              onChange={e => setRefundAmount(Number(e.target.value))}
                           />
                        </motion.div>
                     )}
                  </div>

                  <div className="space-y-6 flex flex-col">
                     <label className="text-[10px] font-black text-indigo-200 uppercase tracking-widest block">Resolution Rationale (Mandatory)</label>
                     <textarea 
                        className="flex-1 w-full bg-white/10 border-2 border-white/20 rounded-[32px] p-6 text-white font-medium text-sm focus:outline-none focus:border-white transition-all placeholder:text-indigo-300 resize-none"
                        placeholder="Detail the logic behind this determination. Both parties will be formally notified of this note..."
                        value={adminNote}
                        onChange={e => setAdminNote(e.target.value)}
                        disabled={complaint.status === 'RESOLVED'}
                     />
                     <button 
                        onClick={handleResolve}
                        disabled={submitting || complaint.status === 'RESOLVED'}
                        className="w-full py-5 bg-white text-indigo-600 rounded-[28px] font-black text-xs uppercase shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                     >
                        {submitting ? 'TRANSMITTING VERDICT...' : complaint.status === 'RESOLVED' ? 'LITIGATION ARCHIVED' : `EXECUTE DETERMINATION ${decision ? ` - ${decision.replace(/_/g, ' ')}` : ''}`}
                     </button>
                  </div>
               </div>
            </div>
            <Scale className="absolute bottom-0 right-0 text-white/5 -translate-x-1/4 translate-y-1/4" size={320} />
         </div>
      </div>
    </div>
  )
}
