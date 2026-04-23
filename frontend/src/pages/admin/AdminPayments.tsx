import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { 
  CreditCard, ShieldCheck, DollarSign, ArrowUpRight, 
  ArrowDownRight, RefreshCw, Calendar, Loader, 
  Download, Filter, Search, MoreVertical, CheckCircle, 
  XCircle, AlertCircle, TrendingUp, History
} from 'lucide-react'
import { motion } from 'motion/react'
import toast from 'react-hot-toast'

export default function AdminPayments() {
  const [escrow, setEscrow] = useState<any>(null)
  const [comms, setComms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [resEscrow, resComms] = await Promise.all([
        api.getEscrowMetrics(),
        api.getCommissionHistory()
      ])
      setEscrow(resEscrow)
      setComms(resComms)
    } catch (e) {
      toast.error('Financial data sync failure')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  return (
    <div className="space-y-8">
      {/* Financial Health Hero */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="lg:col-span-2 bg-slate-900 p-10 rounded-[48px] text-white relative overflow-hidden group">
            <div className="relative z-10 h-full flex flex-col justify-between">
               <div>
                  <h1 className="text-3xl font-black tracking-tight flex items-center gap-4">
                     Transactional Clearing House
                     <ShieldCheck className="text-emerald-500" size={32} />
                  </h1>
                  <p className="text-slate-400 font-medium mt-2 max-w-sm uppercase text-[10px] tracking-widest">Platform-wide Liquidity & Escrow Governance</p>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-12">
                  <div className="space-y-2">
                     <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Protected Escrow (Held)</p>
                     <div className="flex items-end gap-3">
                        <p className="text-5xl font-black text-white">₹{escrow?.totalHeld?.toLocaleString() || '0'}</p>
                        <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg flex items-center gap-1 mb-2">
                           <TrendingUp size={12} /> SECURE
                        </span>
                     </div>
                  </div>
                  <div className="space-y-2">
                     <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">MTD Commission Yield</p>
                     <div className="flex items-end gap-3">
                        <p className="text-5xl font-black text-indigo-400">₹{comms[0]?.commAmount?.toLocaleString() || '0'}</p>
                        <span className="text-[10px] font-black text-indigo-400 bg-indigo-400/10 px-2 py-1 rounded-lg mb-2 uppercase">Net Flux</span>
                     </div>
                  </div>
               </div>
            </div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2 group-hover:bg-indigo-600/20 transition-all duration-700" />
            <DollarSign className="absolute bottom-0 right-10 text-white/5 -translate-y-1/4" size={200} />
         </div>

         {/* Rapid Actions */}
         <div className="bg-white p-8 rounded-[40px] border-2 border-sp-border-light shadow-sm flex flex-col gap-4">
            <h3 className="text-xs font-black text-sp-placeholder uppercase tracking-widest mb-2 flex items-center gap-2">
               <ArrowUpRight size={14} className="text-indigo-600" /> Treasury Controls
            </h3>
            <button className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2">
               <RefreshCw size={14} /> Global Reconciliation
            </button>
            <button className="w-full py-4 bg-white border-2 border-sp-border-light text-sp-text rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-indigo-600 transition-all flex items-center justify-center gap-2">
               <Download size={14} /> Export Fiscal Report
            </button>
            <div className="mt-auto p-5 bg-sp-bg rounded-3xl border border-sp-border-light text-center">
               <p className="text-[10px] font-black text-sp-placeholder uppercase tracking-tighter">Automated Payouts</p>
               <p className="text-xs font-bold text-sp-text mt-1">NEXT RUN: 04:00 AM IST</p>
            </div>
         </div>
      </div>

      {/* Primary Data Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
         {/* Ledger Table */}
         <div className="xl:col-span-2 bg-white rounded-[40px] border-2 border-sp-border-light shadow-sm overflow-hidden">
            <div className="p-7 border-b-2 border-sp-border-light flex items-center justify-between bg-sp-bg/20">
               <h3 className="text-sm font-black text-sp-text uppercase tracking-widest flex items-center gap-3">
                  Transactional Audit Log
                  <History className="text-sp-purple" size={16} />
               </h3>
               <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-sp-placeholder" size={14} />
                  <input type="text" placeholder="Trace ID..." className="pl-9 pr-4 py-2 bg-white border border-sp-border-light rounded-xl text-[10px] font-black outline-none focus:border-indigo-500 w-40 transition-all" />
               </div>
            </div>
            
            <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead className="bg-sp-bg/40">
                     <tr className="border-b border-sp-border-light">
                        <th className="py-5 px-8 text-[9px] font-black uppercase tracking-widest text-sp-placeholder">Sequence ID</th>
                        <th className="py-5 px-3 text-[9px] font-black uppercase tracking-widest text-sp-placeholder">Entity Info</th>
                        <th className="py-5 px-3 text-[9px] font-black uppercase tracking-widest text-sp-placeholder text-center">Value</th>
                        <th className="py-5 px-3 text-[9px] font-black uppercase tracking-widest text-sp-placeholder">Held Since</th>
                        <th className="py-5 px-8 text-right text-[9px] font-black uppercase tracking-widest text-sp-placeholder">Escrow State</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-sp-border-light">
                     {loading ? (
                        <tr><td colSpan={5} className="py-20 text-center"><Loader size={32} className="text-indigo-600 animate-spin mx-auto" /></td></tr>
                     ) : escrow?.orders.length === 0 ? (
                        <tr><td colSpan={5} className="py-20 text-center uppercase font-black text-sp-placeholder text-sm">Clear Ledger</td></tr>
                     ) : (
                        escrow?.orders.map((o: any) => (
                           <tr key={o._id} className="hover:bg-sp-bg/30 transition-all cursor-pointer">
                              <td className="py-5 px-8">
                                 <p className="text-xs font-black text-indigo-600 tracking-tighter">#{o.orderId}</p>
                              </td>
                              <td className="py-5 px-3">
                                 <p className="text-[11px] font-bold text-sp-text truncate max-w-[140px] uppercase">{o.manufacturer?.company}</p>
                              </td>
                              <td className="py-5 px-3 text-center font-black text-xs">₹{o.valueRaw?.toLocaleString()}</td>
                              <td className="py-5 px-3 text-[10px] font-medium text-sp-placeholder uppercase">{new Date(o.updatedAt).toLocaleDateString()}</td>
                              <td className="py-5 px-8 text-right">
                                 <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                                    o.escrowStatus === 'Released' ? 'bg-emerald-50 text-emerald-600' :
                                    o.escrowStatus === 'Refunded' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                                 }`}>
                                    {o.escrowStatus}
                                 </span>
                              </td>
                           </tr>
                        ))
                     )}
                  </tbody>
               </table>
            </div>
         </div>

         {/* Secondary Metrics */}
         <div className="space-y-6">
            {/* Commission Stream */}
            <div className="bg-white p-8 rounded-[40px] border-2 border-sp-border-light shadow-sm">
               <h3 className="text-xs font-black text-sp-placeholder uppercase tracking-widest mb-6 flex items-center gap-2">
                  <CreditCard size={14} className="text-sp-purple" /> Yield Analytics
               </h3>
               <div className="space-y-6">
                  {comms.map((c, i) => (
                     <div key={i} className="flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-sp-bg rounded-xl flex flex-col items-center justify-center border border-sp-border-light group-hover:bg-indigo-600 group-hover:text-white transition-all">
                              <span className="text-[8px] font-black uppercase opacity-60">MON</span>
                              <span className="text-[12px] font-black">{c._id}</span>
                           </div>
                           <div>
                              <p className="text-[11px] font-black text-sp-text uppercase">Volume Clearing</p>
                              <p className="text-[9px] font-bold text-sp-placeholder">₹{c.totalValue.toLocaleString()} Gross</p>
                           </div>
                        </div>
                        <p className="text-xs font-black text-indigo-600">+₹{c.commAmount.toLocaleString()}</p>
                     </div>
                  ))}
               </div>
            </div>

            {/* Anomaly Watch */}
            <div className="bg-rose-600 p-8 rounded-[40px] text-white shadow-xl relative overflow-hidden group">
                <div className="relative z-10">
                   <h3 className="text-xs font-black text-rose-200 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <AlertCircle size={14} /> Anomaly Detection
                   </h3>
                   <div className="space-y-4">
                      <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
                         <p className="text-[10px] font-black text-rose-100 uppercase">Suspicious High-Value Refund</p>
                         <p className="text-xs font-bold mt-1">#ORD-66723 Triggered Action</p>
                      </div>
                      <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
                         <p className="text-[10px] font-black text-rose-100 uppercase">Webhook Latency Detected</p>
                         <p className="text-xs font-bold mt-1">Razorpay Endpoint - 400ms</p>
                      </div>
                   </div>
                   <button className="w-full py-4 bg-white text-rose-600 rounded-[24px] font-black text-[10px] uppercase mt-6 hover:scale-[1.02] transition-all">
                      VIEW FULL RISK LOG
                   </button>
                </div>
                <AlertCircle className="absolute bottom-0 right-0 text-white/5 -translate-x-1/4 translate-y-1/4 group-hover:scale-110 transition-all duration-700" size={160} />
            </div>
         </div>
      </div>
    </div>
  )
}
