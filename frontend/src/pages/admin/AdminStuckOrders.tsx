import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { 
  AlertCircle, ArrowLeft, Clock, Zap, MessageSquare, 
  ChevronRight, Building2, User as UserIcon, Loader, 
  Send, Phone, ShieldAlert, CheckCircle, RefreshCw
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import toast from 'react-hot-toast'

export default function AdminStuckOrders() {
  const [data, setData] = useState<any>({ notDispatched: [], notConfirmed: [] })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'shipment' | 'confirmation'>('shipment')

  const fetchStuck = async () => {
    setLoading(true)
    try {
      const res = await api.getStuckOrders()
      setData(res)
    } catch (e) { toast.error('Failed to analyze stuck orders') }
    finally { setLoading(false) }
  }

  useEffect(() => {
    fetchStuck()
  }, [])

  const handleNudge = async (id: string, partner: string) => {
    try {
      await api.nudgePartner(id) // System nudge
      toast.success(`Reminder transmitted to ${partner}`)
    } catch (e) { toast.error('Communication failure') }
  }

  const getLatency = (date: string) => {
     const hours = (Date.now() - new Date(date).getTime()) / (1000 * 60 * 60)
     if (hours > 72) return { label: `${(hours/24).toFixed(1)} DAYS`, color: 'text-rose-600', bg: 'bg-rose-50' }
     return { label: `${hours.toFixed(1)} HRS`, color: 'text-amber-600', bg: 'bg-amber-50' }
  }

  const list = activeTab === 'shipment' ? data.notDispatched : data.notConfirmed

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin/orders" className="p-3 bg-white border border-sp-border rounded-xl text-sp-placeholder hover:text-sp-text transition-all shadow-sm">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-sp-text tracking-tight flex items-center gap-3">
              Fulfillment Monitoring
              <Clock className="text-rose-600 animate-pulse" size={24} />
            </h1>
            <p className="text-[10px] font-black text-sp-muted uppercase tracking-widest mt-1">Real-time latency detection for transactional sequences</p>
          </div>
        </div>
        <button onClick={fetchStuck} className="p-3 bg-white border border-sp-border rounded-xl text-sp-placeholder hover:text-indigo-600 transition-all shadow-sm">
           <RefreshCw size={18} />
        </button>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 gap-4 bg-white p-2 border-2 border-sp-border-light rounded-[32px] shadow-sm">
         <button 
            onClick={() => setActiveTab('shipment')}
            className={`flex flex-col items-center gap-1 py-4 rounded-[24px] transition-all relative ${activeTab === 'shipment' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'text-sp-placeholder hover:bg-sp-bg/50'}`}
         >
            <Zap size={20} />
            <span className="text-[11px] font-black uppercase tracking-widest">Shipment Lag</span>
            <span className="text-[9px] font-bold opacity-60">Confirmed {'>'} 72h</span>
            {data.notDispatched.length > 0 && <span className="absolute top-3 right-4 h-5 w-5 rounded-full bg-rose-600 text-white text-[10px] flex items-center justify-center font-black">{data.notDispatched.length}</span>}
         </button>
         <button 
            onClick={() => setActiveTab('confirmation')}
            className={`flex flex-col items-center gap-1 py-4 rounded-[24px] transition-all relative ${activeTab === 'confirmation' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'text-sp-placeholder hover:bg-sp-bg/50'}`}
         >
            <ShieldAlert size={20} />
            <span className="text-[11px] font-black uppercase tracking-widest">Acknowledgment Delay</span>
            <span className="text-[9px] font-bold opacity-60">Pending {'>'} 24h</span>
            {data.notConfirmed.length > 0 && <span className="absolute top-3 right-4 h-5 w-5 rounded-full bg-amber-600 text-white text-[10px] flex items-center justify-center font-black">{data.notConfirmed.length}</span>}
         </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]"><Loader size={32} className="text-sp-purple animate-spin" /></div>
      ) : list.length === 0 ? (
        <div className="bg-white p-20 rounded-[48px] border-2 border-sp-border-light text-center border-dashed">
           <CheckCircle size={56} className="text-emerald-500 mx-auto mb-6" />
           <h3 className="text-xl font-black text-sp-text uppercase tracking-tight">Optimal Sequence</h3>
           <p className="text-sm font-medium text-sp-placeholder mt-2 uppercase tracking-wide">All fulfillment metrics are within platform SLA thresholds</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
           {list.map((o: any) => {
              const latency = getLatency(activeTab === 'shipment' ? o.updatedAt : o.createdAt)
              return (
                 <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} key={o._id} className="bg-white rounded-[40px] border-2 border-sp-border-light shadow-sm overflow-hidden flex flex-col group hover:border-rose-200 transition-all">
                    <div className="p-7 border-b-2 border-sp-border-light flex items-center justify-between">
                       <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 ${latency.bg} ${latency.color}`}>
                          <Clock size={10} /> LATENCY: {latency.label}
                       </span>
                       <Link to={`/admin/orders/${o._id}`} className="text-sp-placeholder hover:text-sp-purple transition-all"><ChevronRight size={20} /></Link>
                    </div>
                    
                    <div className="p-7 flex-1 space-y-5">
                       <div>
                          <p className="text-xs font-black text-indigo-600 tracking-tighter">#{o.orderId}</p>
                          <p className="text-[10px] font-black text-sp-text uppercase mt-0.5 leading-tight">{o.items}</p>
                       </div>
                       
                       <div className="p-5 bg-sp-bg/40 rounded-3xl border border-sp-border-light">
                          <div className="flex items-center gap-3 mb-4">
                             <div className="w-8 h-8 rounded-lg bg-white border border-sp-border flex items-center justify-center font-black text-[10px] text-sp-purple">M</div>
                             <div>
                                <p className="text-[10px] font-black text-sp-text leading-none">{o.manufacturer?.company}</p>
                                <p className="text-[9px] font-bold text-sp-placeholder uppercase mt-1 tracking-tight">Supplier Node</p>
                             </div>
                          </div>
                          <div className="flex gap-2">
                             <a href={`tel:${o.manufacturer?.phone}`} className="flex-1 py-2 bg-white border border-sp-border rounded-xl text-sp-placeholder hover:text-sp-purple transition-all flex items-center justify-center"><Phone size={14} /></a>
                             <a href={`mailto:${o.manufacturer?.email}`} className="flex-1 py-2 bg-white border border-sp-border rounded-xl text-sp-placeholder hover:text-sp-purple transition-all flex items-center justify-center"><Send size={14} /></a>
                          </div>
                       </div>
                    </div>

                    <div className="px-7 py-6 bg-sp-bg/20 border-t-2 border-sp-border-light flex gap-3">
                       <button onClick={() => handleNudge(o._id, o.manufacturer.company)} className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-white border-2 border-sp-border-light rounded-2xl text-[10px] font-black text-indigo-600 uppercase hover:bg-indigo-600 hover:text-white transition-all shadow-sm group/btn">
                          <Zap size={14} className="group-hover/btn:animate-bounce" /> TRANSMIT NUDGE
                       </button>
                    </div>
                 </motion.div>
              )
           })}
        </div>
      )}
    </div>
  )
}
