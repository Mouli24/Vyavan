import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { 
  Zap, Shield, Crown, CheckCircle2, Layout, 
  Settings2, Users, Search, History, ArrowUpRight,
  Info, AlertCircle, Loader, Edit3, Save, X, Plus,
  Database, Activity, Lock, PieChart
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import toast from 'react-hot-toast'

export default function AdminPlans() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editingPlan, setEditingPlan] = useState<string | null>(null)
  const [overrideUser, setOverrideUser] = useState('')
  const [overridePlan, setOverridePlan] = useState('')
  const [overrideReason, setOverrideReason] = useState('')
  const [isOverriding, setIsOverriding] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await api.getPricingPlans()
      setData(res)
    } catch (e) { toast.error('Subscription registry sync failure') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const handleOverride = async () => {
    if (!overrideUser || !overridePlan || !overrideReason) {
       toast.error('All override parameters are mandatory')
       return
    }
    setIsOverriding(true)
    try {
       await api.overrideUserPlan({ userId: overrideUser, planType: overridePlan, reason: overrideReason })
       toast.success('Manufacturer tier updated. Log entry created.')
       setOverrideUser('')
       setOverrideReason('')
       fetchData()
    } catch (e) { toast.error('Override transmission failure') }
    finally { setIsOverriding(false) }
  }

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader size={32} className="text-indigo-600 animate-spin" /></div>

  const getPlanIcon = (name: string) => {
    switch(name) {
      case 'Premium': return <Crown className="text-amber-500" size={24} />
      case 'Basic':   return <Zap className="text-indigo-500" size={24} />
      default:        return <Shield className="text-emerald-500" size={24} />
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-sp-text tracking-tight flex items-center gap-3">
           Monetization Governance
           <Layout className="text-sp-purple" size={32} />
        </h1>
        <p className="text-[11px] font-black text-sp-muted uppercase tracking-[0.2em] mt-1">Tier-based Feature Gating & Revenue Architecting</p>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {data.plans?.map((plan: any) => (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} key={plan._id} className="bg-white rounded-[48px] border-2 border-sp-border-light shadow-sm overflow-hidden flex flex-col group hover:border-indigo-200 transition-all">
               <div className="p-8 border-b-2 border-sp-border-light bg-sp-bg/20 flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-white rounded-3xl border border-sp-border shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                     {getPlanIcon(plan.name)}
                  </div>
                  <h3 className="text-xl font-black uppercase text-sp-text tracking-tight">{plan.name} SCALE</h3>
                  <div className="mt-4 flex items-baseline gap-1 text-indigo-600">
                     <span className="text-lg font-black tracking-tight">₹</span>
                     <span className="text-4xl font-black tracking-tighter">{plan.price}</span>
                     <span className="text-xs font-black uppercase text-sp-placeholder tracking-widest">/MO</span>
                  </div>
               </div>
               
               <div className="p-8 flex-1 space-y-6">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-sp-placeholder">
                     <span>Provisioned Tokens</span>
                     <Users size={14} />
                  </div>
                  <div className="space-y-3">
                     <div className="flex items-center justify-between p-3 bg-sp-bg rounded-2xl border border-sp-border-light">
                        <span className="text-[10px] font-black uppercase text-sp-text">Product SKUs</span>
                        <span className="text-sm font-black text-indigo-600">{plan.limits?.products || '∞'}</span>
                     </div>
                     <div className="flex items-center justify-between p-3 bg-sp-bg rounded-2xl border border-sp-border-light">
                        <span className="text-[10px] font-black uppercase text-sp-text">Commission Cap</span>
                        <span className="text-sm font-black text-indigo-600">{plan.limits?.commissions || 10}%</span>
                     </div>
                  </div>
                  
                  <div className="pt-6 border-t border-sp-border-light space-y-3">
                     {plan.features?.map((f: string, i: number) => (
                        <div key={i} className="flex items-center gap-3 text-xs font-bold text-sp-text">
                           <CheckCircle2 className="text-emerald-500" size={16} />
                           {f}
                        </div>
                     ))}
                  </div>
               </div>

               <div className="p-8 pt-0">
                  <button className="w-full py-4 bg-indigo-600 text-white rounded-[24px] text-[10px] font-black uppercase tracking-widest hover:opacity-90 shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2">
                     <Edit3 size={14} /> OPTIMIZE CONFIG
                  </button>
               </div>
            </motion.div>
         ))}

         {(!data.plans || data.plans.length === 0) && (
            <div className="col-span-full py-24 text-center bg-white rounded-[48px] border-2 border-dashed border-sp-border-light text-sp-placeholder font-black uppercase tracking-widest">
               No subscription models detected in registry
            </div>
         )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
         {/* Manual Intervention Hub */}
         <div className="bg-slate-900 p-10 rounded-[48px] text-white relative overflow-hidden flex flex-col">
            <div className="relative z-10 space-y-8 flex-1">
               <div>
                  <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                     Manual Entity Override
                     <Activity className="text-indigo-400" size={24} />
                  </h3>
                  <p className="text-slate-400 text-xs font-medium mt-2 max-w-sm uppercase tracking-wide">Emergency tier adjustments & legacy support interventions</p>
               </div>

               <div className="space-y-4">
                  <div className="relative group">
                     <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-white transition-colors" size={18} />
                     <input 
                        type="text" 
                        placeholder="Manufacturer UUID or Domain..." 
                        className="w-full bg-slate-800 border-2 border-slate-700 rounded-[28px] pl-12 pr-6 py-4 placeholder:text-slate-600 text-sm font-medium focus:outline-none focus:border-indigo-500 transition-all"
                        value={overrideUser}
                        onChange={e => setOverrideUser(e.target.value)}
                     />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Target Frequency</label>
                        <select 
                           value={overridePlan}
                           onChange={e => setOverridePlan(e.target.value)}
                           className="w-full bg-slate-800 border-2 border-slate-700 rounded-[24px] px-6 py-4 text-sm font-medium focus:outline-none focus:border-indigo-500 appearance-none"
                        >
                           <option value="">SELECT TIER</option>
                           <option value="Free">FREE SCALE</option>
                           <option value="Basic">BASIC SCALE</option>
                           <option value="Premium">PREMIUM SCALE</option>
                        </select>
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Intervention Note</label>
                        <input 
                           type="text" 
                           placeholder="Reason for change..." 
                           className="w-full bg-slate-800 border-2 border-slate-700 rounded-[24px] px-6 py-4 text-sm font-medium focus:outline-none focus:border-indigo-500"
                           value={overrideReason}
                           onChange={e => setOverrideReason(e.target.value)}
                        />
                     </div>
                  </div>
               </div>

               <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-3xl flex gap-4">
                  <AlertCircle className="text-rose-500 shrink-0" size={20} />
                  <p className="text-[11px] font-medium leading-relaxed italic text-rose-200/80">Confirming this action will override existing billing cycles. A non-repudiation audit trail will be permanently logged in the system activity bank.</p>
               </div>
            </div>

            <button 
               onClick={handleOverride}
               disabled={isOverriding}
               className="w-full py-5 bg-indigo-600 rounded-[28px] text-[10px] font-black uppercase tracking-widest mt-10 shadow-2xl hover:bg-indigo-500 transition-all disabled:opacity-50"
            >
               {isOverriding ? 'COMMITTING VERDICT...' : 'EXECUTE OVERRIDE'}
            </button>
            <Database className="absolute bottom-0 right-0 text-white/5 -translate-x-1/4 translate-y-1/4" size={240} />
         </div>

         {/* Distribution & Stats */}
         <div className="bg-white p-10 rounded-[48px] border-2 border-sp-border-light shadow-sm flex flex-col">
            <h3 className="text-xl font-black uppercase tracking-tight mb-10 flex items-center gap-3">
               Adoption Metrics
               <PieChart className="text-sp-purple" size={24} />
            </h3>
            <div className="flex-1 space-y-8">
               {data.stats?.map((s: any, i: number) => (
                  <div key={i} className="space-y-3">
                     <div className="flex justify-between items-end">
                        <p className="text-xs font-black uppercase tracking-widest text-slate-800">{s._id || 'UNASSIGNED'}</p>
                        <p className="text-xs font-black text-indigo-600">{s.count} Partners</p>
                     </div>
                     <div className="h-6 bg-sp-bg rounded-2xl overflow-hidden border border-sp-border-light flex p-1">
                        <motion.div 
                           initial={{ width: 0 }} 
                           animate={{ width: `${(s.count / data.stats.reduce((a:any,b:any)=>a+b.count,0)) * 100}%` }}
                           className={`h-full rounded-xl ${i===0?'bg-indigo-500':i===1?'bg-sp-purple':'bg-emerald-500'}`} 
                        />
                     </div>
                  </div>
               ))}
               <div className="mt-auto pt-10 border-t border-sp-border-light grid grid-cols-2 gap-8">
                  <div className="space-y-1">
                     <p className="text-[10px] font-black text-sp-placeholder uppercase tracking-widest">Growth Delta</p>
                     <p className="text-3xl font-black text-emerald-600">+14.2%</p>
                  </div>
                  <div className="space-y-1 text-right">
                     <p className="text-[10px] font-black text-sp-placeholder uppercase tracking-widest">Yield Potential</p>
                     <p className="text-3xl font-black text-indigo-600">₹84k</p>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  )
}
