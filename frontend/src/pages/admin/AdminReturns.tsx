import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { 
  RotateCcw, Search, Filter, Clock, AlertCircle, 
  ChevronRight, Building2, User as UserIcon, Loader, 
  MessageSquare, ShieldAlert, Zap, Truck, CheckCircle
} from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function AdminReturns() {
  const [list, setList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'OPEN' | 'RESOLVED' | 'ESCALATED'>('OPEN')

  const fetchReturns = async () => {
    setLoading(true)
    try {
      // Reusing complaints with category 'return'
      const res = await api.getAdminComplaints({ status: activeTab === 'OPEN' ? 'PENDING' : activeTab, type: 'return' })
      setList(res.data)
    } catch (e) { toast.error('Failed to load returns') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchReturns() }, [activeTab])

  const handleNudge = async (id: string) => {
     try {
        await api.nudgeManufacturer(id)
        toast.success('Manufacturer nudged successfully')
     } catch (e) { toast.error('Nudge failed') }
  }

  const isDelayed = (date: string) => {
     const hours = (Date.now() - new Date(date).getTime()) / (1000 * 60 * 60)
     return hours > 48
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-sp-text tracking-tight flex items-center gap-3">
             Reverse Logistics Monitor
             <RotateCcw className="text-sp-purple" size={24} />
          </h1>
          <p className="text-[10px] font-black text-sp-muted uppercase tracking-widest mt-1">Centralized Return Authorization & Intervention</p>
        </div>
      </div>

      <div className="flex items-center gap-2 p-1.5 bg-white border-2 border-sp-border-light w-fit rounded-[24px]">
         <button onClick={() => setActiveTab('OPEN')} className={`px-6 py-3 rounded-[18px] text-xs font-black uppercase transition-all ${activeTab === 'OPEN' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-sp-placeholder hover:text-sp-text'}`}>Open Requests</button>
         <button onClick={() => setActiveTab('ESCALATED')} className={`px-6 py-3 rounded-[18px] text-xs font-black uppercase transition-all ${activeTab === 'ESCALATED' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-sp-placeholder hover:text-sp-text'}`}>Escalated</button>
         <button onClick={() => setActiveTab('RESOLVED')} className={`px-6 py-3 rounded-[18px] text-xs font-black uppercase transition-all ${activeTab === 'RESOLVED' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-sp-placeholder hover:text-sp-text'}`}>Resolved</button>
      </div>

      <div className="bg-white rounded-[40px] border-2 border-sp-border-light shadow-sm overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead className="bg-sp-bg/40">
                  <tr className="border-b border-sp-border-light text-slate-900 font-bold">
                     <th className="py-5 px-8 text-[10px] font-black uppercase tracking-widest text-sp-placeholder">Request Ref</th>
                     <th className="py-5 px-3 text-[10px] font-black uppercase tracking-widest text-sp-placeholder">Buyer Entity</th>
                     <th className="py-5 px-3 text-[10px] font-black uppercase tracking-widest text-sp-placeholder">Target Manufacturer</th>
                     <th className="py-5 px-3 text-[10px] font-black uppercase tracking-widest text-sp-placeholder text-center">Latency</th>
                     <th className="py-5 px-8 text-right text-[10px] font-black uppercase tracking-widest text-sp-placeholder">Control</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-sp-border-light">
                  {loading ? (
                    <tr><td colSpan={5} className="py-20 text-center"><Loader size={32} className="text-indigo-600 animate-spin mx-auto" /></td></tr>
                  ) : list.length === 0 ? (
                    <tr><td colSpan={5} className="py-20 text-center uppercase font-black text-sp-placeholder text-sm">No reverse logistics requests in segment</td></tr>
                  ) : (
                    list.map(r => {
                       const delayed = isDelayed(r.updatedAt)
                       return (
                          <tr key={r._id} className={`hover:bg-sp-bg/20 transition-all group ${delayed ? 'bg-rose-50/50' : ''}`}>
                             <td className="py-6 px-8">
                                <p className="text-xs font-black text-indigo-600 uppercase tracking-tighter">#{r.complaintId}</p>
                                <p className="text-[10px] font-bold text-sp-placeholder uppercase mt-1">{r.title}</p>
                             </td>
                             <td className="py-6 px-3">
                                <div className="flex items-center gap-2">
                                   <div className="w-5 h-5 bg-sp-bg rounded flex items-center justify-center text-[8px] font-black text-sp-purple">B</div>
                                   <p className="text-[11px] font-bold text-sp-text">{r.buyer?.company || r.buyer?.name}</p>
                                </div>
                             </td>
                             <td className="py-6 px-3">
                                <div className="flex items-center gap-2">
                                   <div className="w-5 h-5 bg-indigo-100 rounded flex items-center justify-center text-[8px] font-black text-indigo-600">M</div>
                                   <p className="text-[11px] font-bold text-sp-text">{r.manufacturer?.company}</p>
                                </div>
                             </td>
                             <td className="py-6 px-3 text-center">
                                {delayed ? (
                                   <div className="flex flex-col items-center gap-1">
                                      <span className="text-[9px] font-black text-rose-600 bg-rose-100 px-2 rounded-lg">DELAYED {'>'} 48H</span>
                                      <button onClick={() => handleNudge(r._id)} className="text-[8px] font-black text-sp-purple hover:underline uppercase tracking-widest">Transmit Nudge</button>
                                   </div>
                                ) : (
                                   <span className="text-[10px] font-black text-sp-placeholder uppercase tracking-widest">Within SLA</span>
                                )}
                             </td>
                             <td className="py-6 px-8 text-right">
                                <Link 
                                   to={`/admin/complaints/${r._id}/resolution`}
                                   className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-sp-border rounded-xl text-[10px] font-black text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                >
                                   INTERVENE <ChevronRight size={14} />
                                </Link>
                             </td>
                          </tr>
                       )
                    })
                  )}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  )
}
