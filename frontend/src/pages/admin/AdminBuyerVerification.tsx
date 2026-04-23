import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { motion, AnimatePresence } from 'motion/react'
import { 
  ShieldCheck, Clock, CheckCircle, XCircle, 
  FileText, Building2, User as UserIcon, Loader, 
  ArrowLeft, ExternalLink, Calendar, AlertCircle
} from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function AdminBuyerVerification() {
  const [apps, setApps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const fetchApps = async () => {
    setLoading(true)
    try {
      // Reusing getAdminManufacturers with status=pending logic but for buyers
      const res = await api.getAdminBuyers({ status: 'pending', limit: 100 })
      setApps(res.data)
    } catch (e) {
      toast.error('Failed to load pending buyers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchApps()
  }, [])

  const handleApprove = async (id: string) => {
    try {
      await api.approveBuyer(id) // I need to add this to api.ts
      setApps(apps.filter(a => a._id !== id))
      toast.success('Buyer account activated')
    } catch (e) { toast.error('Action failed') }
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) return
    try {
      await api.rejectBuyer(rejectingId!, rejectReason) // I need to add this to api.ts
      setApps(apps.filter(a => a._id !== rejectingId))
      setRejectingId(null)
      setRejectReason('')
      toast.success('Application rejected')
    } catch (e) { toast.error('Action failed') }
  }

  const getSLALevel = (createdAt: string) => {
    const elapsedHours = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60)
    if (elapsedHours > 36) return { color: 'text-rose-600', bg: 'bg-rose-50', label: 'CRITICAL (>36h)' }
    if (elapsedHours > 12) return { color: 'text-amber-600', bg: 'bg-amber-50', label: 'PENDING (>12h)' }
    return { color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'NEW (<12h)' }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin/buyers" className="p-3 bg-white border border-sp-border rounded-xl text-sp-placeholder hover:text-sp-text transition-all">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-sp-text tracking-tight flex items-center gap-2">
              Buyer Approval Pipeline
              <ShieldCheck className="text-sp-purple" size={24} />
            </h1>
            <p className="text-[10px] font-black text-sp-muted uppercase tracking-widest mt-1">Screening procurement entities for platform access</p>
          </div>
        </div>
        <div className="px-4 py-2 bg-sp-bg border border-sp-border rounded-2xl text-xs font-black text-sp-purple shadow-sm">
           {apps.length} PENDING APPLICATIONS
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]"><Loader size={32} className="text-sp-purple animate-spin" /></div>
      ) : apps.length === 0 ? (
        <div className="bg-white p-20 rounded-[40px] border-2 border-sp-border-light text-center">
           <CheckCircle size={56} className="text-emerald-500 mx-auto mb-6" />
           <h3 className="text-xl font-black text-sp-text uppercase">Pipeline Clear</h3>
           <p className="text-sm font-medium text-sp-placeholder mt-2 uppercase tracking-wide">All buyers have been processed</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {apps.map(app => {
            const sla = getSLALevel(app.createdAt)
            return (
              <motion.div layout id={`card-${app._id}`} key={app._id} className="bg-white rounded-[32px] border-2 border-sp-border-light shadow-sm overflow-hidden flex flex-col hover:border-sp-purple/20 transition-all group">
                <div className="p-6 border-b-2 border-sp-border-light">
                   <div className="flex items-center justify-between mb-4">
                      <div className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-tighter flex items-center gap-1 ${sla.bg} ${sla.color}`}>
                         <Clock size={10} /> {sla.label}
                      </div>
                      <span className="text-[10px] font-black text-sp-placeholder uppercase">{app.profile?.businessType || 'Retailer'}</span>
                   </div>
                   <h3 className="text-lg font-black text-sp-text leading-tight group-hover:text-sp-purple transition-colors">{app.company || app.name}</h3>
                   <div className="flex items-center gap-1.5 mt-1.5 text-xs font-bold text-sp-placeholder">
                      <UserIcon size={12} /> {app.name}
                   </div>
                </div>

                <div className="p-6 flex-1 space-y-4">
                   <div className="p-4 bg-sp-bg/50 rounded-2xl border border-sp-border-light space-y-3">
                      <div className="flex items-center justify-between">
                         <span className="text-[10px] font-black text-sp-placeholder uppercase">GST Number</span>
                         <span className="text-xs font-black text-sp-text">{app.profile?.gstNumber || 'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                         <span className="text-[10px] font-black text-sp-placeholder uppercase">Applied On</span>
                         <span className="text-xs font-black text-sp-text">{new Date(app.createdAt).toLocaleDateString()}</span>
                      </div>
                   </div>

                   <button className="w-full flex items-center justify-between p-4 bg-white border-2 border-sp-border-light rounded-2xl hover:border-indigo-600 hover:text-indigo-600 transition-all group/doc">
                      <div className="flex items-center gap-3">
                         <FileText size={20} className="text-indigo-600" />
                         <div className="text-left">
                            <p className="text-xs font-black uppercase">GST Certificate</p>
                            <p className="text-[9px] font-bold text-sp-placeholder uppercase">Business Authentication</p>
                         </div>
                      </div>
                      <ExternalLink size={14} className="opacity-0 group-hover/doc:opacity-100 transition-opacity" />
                   </button>
                </div>

                <div className="p-6 bg-sp-bg/20 border-t-2 border-sp-border-light flex gap-3">
                   <button 
                      onClick={() => setRejectingId(app._id)}
                      className="flex-1 py-3 bg-white border-2 border-rose-100 text-rose-500 rounded-2xl text-[10px] font-black uppercase hover:bg-rose-50 transition-all"
                   >
                      REJECT
                   </button>
                   <button 
                      onClick={() => handleApprove(app._id)}
                      className="flex-1 py-3 bg-sp-purple text-white rounded-2xl text-[10px] font-black uppercase hover:opacity-90 transition-all shadow-lg shadow-sp-purple/10"
                   >
                      APPROVE
                   </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Reject Modal */}
      {rejectingId && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[40px] p-10 w-full max-w-md shadow-2xl">
               <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center border border-rose-100 text-rose-600">
                     <AlertCircle size={24} />
                  </div>
                  <h3 className="text-xl font-black text-sp-text uppercase tracking-tight">Decline Application</h3>
               </div>
               <p className="text-sm text-sp-placeholder font-medium mb-6 uppercase tracking-wide">
                  Specify why this procurement entity is being denied access.
               </p>
               <textarea
                  className="w-full p-5 bg-sp-bg border-2 border-sp-border-light rounded-[24px] text-sm font-medium resize-none focus:outline-none focus:border-rose-500/20 focus:ring-1 focus:ring-rose-500/20 transition-all"
                  rows={4}
                  placeholder="e.g., GST number mismatch or blurred document..."
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
               />
               <div className="flex gap-4 mt-8">
                  <button onClick={() => setRejectingId(null)} className="flex-1 py-4 bg-white border border-sp-border text-sp-muted font-bold rounded-2xl text-xs hover:bg-sp-bg transition-all uppercase">Cancel</button>
                  <button 
                     onClick={handleReject} 
                     disabled={!rejectReason.trim()}
                     className="flex-1 py-4 bg-rose-600 text-white font-black rounded-2xl text-xs hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-rose-200 uppercase"
                  >
                     Confirm Rejection
                  </button>
               </div>
            </motion.div>
         </div>
      )}
    </div>
  )
}
