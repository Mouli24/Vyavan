import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { 
  BarChart3, TrendingUp, Users, ShoppingBag, 
  MapPin, Archive, Target, Zap, ArrowUpRight, 
  Globe, LayoutGrid, Timer, PieChart, Loader,
  Calendar, ChevronRight
} from 'lucide-react'
import { motion } from 'motion/react'
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar, 
  Cell, PieChart as RePie, Pie
} from 'recharts'
import toast from 'react-hot-toast'

export default function AdminAnalytics() {
  const [gmvData, setGmvData] = useState<any[]>([])
  const [sectorData, setSectorData] = useState<any[]>([])
  const [geoData, setGeoData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState(30)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [resGmv, resSectors, resGeo] = await Promise.all([
        api.getAnalyticGMV(range),
        api.getAnalyticSectors(),
        api.getAnalyticGeo()
      ])
      setGmvData(resGmv)
      setSectorData(resSectors)
      setGeoData(resGeo)
    } catch (e) {
      toast.error('Analytics synchronization failure')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [range])

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader size={32} className="text-indigo-600 animate-spin" /></div>

  const totalGMV = gmvData.reduce((acc, curr) => acc + curr.gmv, 0)
  const totalOrders = gmvData.reduce((acc, curr) => acc + curr.orders, 0)

  return (
    <div className="space-y-8 pb-10">
      {/* Dynamic Command Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-sp-text tracking-tight flex items-center gap-3">
             Platform Intelligence
             <BarChart3 className="text-sp-purple" size={32} />
          </h1>
          <p className="text-[11px] font-black text-sp-muted uppercase tracking-[0.2em] mt-1">Global Economic Volume & Behavioral Sentiment</p>
        </div>
        <div className="flex items-center gap-2 p-1.5 bg-white border-2 border-sp-border-light rounded-[24px] shadow-sm">
           {[7, 30, 90, 365].map(d => (
              <button 
                key={d}
                onClick={() => setRange(d)}
                className={`px-5 py-2.5 rounded-[18px] text-[10px] font-black uppercase transition-all ${range === d ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-sp-placeholder hover:text-sp-text'}`}
              >
                 {d === 365 ? '1 YEAR' : `${d} DAYS`}
              </button>
           ))}
        </div>
      </div>

      {/* Core KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {[
            { label: 'GROSS MERCH VOLUME', val: `₹${(totalGMV/100000).toFixed(2)}L`, delta: '+12.4%', icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { label: 'ORDER VOLUME', val: totalOrders.toLocaleString(), delta: '+8.1%', icon: ShoppingBag, color: 'text-sp-purple', bg: 'bg-sp-purple-pale' },
            { label: 'ACTIVE ECOSYSTEM', val: '1.4k', delta: '+114', icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'AVG BASKET VALUE', val: `₹${(totalGMV / (totalOrders || 1)).toLocaleString(undefined, {maximumFractionDigits:0})}`, delta: '-2.3%', icon: Target, color: 'text-amber-600', bg: 'bg-amber-50' }
         ].map((kpi, i) => (
            <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.1 }} key={i} className="bg-white p-7 rounded-[40px] border-2 border-sp-border-light shadow-sm group hover:border-indigo-200 transition-all">
               <div className="flex items-center justify-between mb-6">
                  <div className={`w-12 h-12 ${kpi.bg} ${kpi.color} rounded-[20px] flex items-center justify-center transition-transform group-hover:scale-110`}>
                     <kpi.icon size={22} />
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-tight py-1 px-2 rounded-lg ${kpi.delta.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                     {kpi.delta}
                  </span>
               </div>
               <p className="text-[10px] font-black text-sp-placeholder uppercase tracking-widest">{kpi.label}</p>
               <h3 className="text-3xl font-black text-slate-800 mt-1">{kpi.val}</h3>
            </motion.div>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Main GMV Chart */}
         <div className="lg:col-span-2 bg-white p-10 rounded-[48px] border-2 border-sp-border-light shadow-sm flex flex-col h-[500px]">
            <div className="flex items-center justify-between mb-10">
               <div>
                  <h3 className="text-xl font-black text-sp-text uppercase tracking-tight">Revenue Trajectory</h3>
                  <p className="text-[10px] font-bold text-sp-placeholder uppercase tracking-widest mt-1">Platform GMV (Daily Distribution)</p>
               </div>
               <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2"><span className="w-3 h-3 bg-indigo-600 rounded-full" /> <span className="text-[10px] font-black uppercase">Revenue</span></div>
                  <div className="flex items-center gap-2"><span className="w-3 h-3 bg-indigo-100 rounded-full" /> <span className="text-[10px] font-black uppercase">Volume</span></div>
               </div>
            </div>
            
            <div className="flex-1 w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={gmvData}>
                     <defs>
                        <linearGradient id="colorGmv" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                           <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                        </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                     <XAxis 
                        dataKey="_id" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} 
                        dy={10} 
                        tickFormatter={(val) => val.split('-').slice(1).join('/')}
                     />
                     <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} />
                     <Tooltip 
                        contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.05)', padding: '16px' }}
                        itemStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }}
                     />
                     <Area type="monotone" dataKey="gmv" stroke="#4f46e5" strokeWidth={4} fillOpacity={1} fill="url(#colorGmv)" />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* Sector Analytics */}
         <div className="bg-slate-900 p-10 rounded-[48px] text-white flex flex-col h-[500px] relative overflow-hidden">
            <div className="relative z-10">
               <h3 className="text-xl font-black uppercase tracking-tight mb-10 flex items-center gap-3">
                  Sector Dominance
                  <PieChart className="text-indigo-400" size={24} />
               </h3>
               
               <div className="space-y-8">
                  {sectorData.slice(0, 5).map((s, i) => (
                    <div key={i} className="group cursor-pointer">
                       <div className="flex justify-between items-end mb-2">
                          <p className="text-xs font-black uppercase tracking-widest">{s._id || 'Unknown'}</p>
                          <p className="text-[10px] font-bold text-slate-500">₹{(s.gmv/1000).toFixed(1)}k</p>
                       </div>
                       <div className="h-4 bg-slate-800 rounded-full overflow-hidden flex">
                          <motion.div 
                             initial={{ width: 0 }} 
                             animate={{ width: `${(s.gmv / totalGMV) * 100}%` }} 
                             className={`h-full ${['bg-indigo-500', 'bg-sp-purple', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500'][i % 5]}`} 
                          />
                       </div>
                    </div>
                  ))}
               </div>

               <div className="mt-12 p-6 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md">
                  <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                     <Timer size={14} /> Latency Warning
                  </p>
                  <p className="text-xs font-medium text-slate-400 leading-relaxed">
                     Furniture sector showing <span className="text-white font-black">12% churn</span> this cycle. Recommend manufacturer retention audit.
                  </p>
               </div>
            </div>
            <LayoutGrid className="absolute bottom-0 right-0 text-white/5 -translate-x-1/4 translate-y-1/4" size={240} />
         </div>

         {/* Geospatial Distribution */}
         <div className="bg-white p-10 rounded-[48px] border-2 border-sp-border-light shadow-sm flex flex-col h-[500px]">
             <div className="flex items-center justify-between mb-10">
                <div>
                   <h3 className="text-xl font-black text-sp-text uppercase tracking-tight">Geospatial Distribution</h3>
                   <p className="text-[10px] font-bold text-sp-placeholder uppercase tracking-widest mt-1">State-wise Transaction Density</p>
                </div>
                <Globe className="text-indigo-600" size={24} />
             </div>
             <div className="flex-1 space-y-6 overflow-y-auto pr-4 custom-scrollbar">
                {geoData.map((g, i) => (
                   <div key={i} className="flex items-center justify-between p-4 bg-sp-bg rounded-2xl border border-sp-border-light hover:border-indigo-200 transition-all group">
                      <div className="flex items-center gap-4">
                         <span className="w-8 h-8 rounded-lg bg-white border border-sp-border flex items-center justify-center text-[10px] font-black text-indigo-600">{i+1}</span>
                         <div>
                            <p className="text-[11px] font-black text-sp-text uppercase">{g._id || 'Unspecified'}</p>
                            <p className="text-[9px] font-bold text-sp-placeholder uppercase tracking-tighter">{g.count} TRANSACTIONS</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="text-xs font-black text-indigo-600">₹{g.gmv?.toLocaleString()}</p>
                         <p className="text-[8px] font-black text-emerald-500 uppercase">Growth +{(Math.random()*10).toFixed(1)}%</p>
                      </div>
                   </div>
                ))}
             </div>
         </div>

         {/* Manufacturer Performance Ranks */}
         <div className="lg:col-span-2 bg-white p-10 rounded-[48px] border-2 border-sp-border-light shadow-sm flex flex-col h-[500px]">
             <div className="flex items-center justify-between mb-10">
                <h3 className="text-xl font-black text-sp-text uppercase tracking-tight">Partner Performance Tiers</h3>
                <div className="flex gap-2">
                   <button className="px-5 py-2.5 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase">Revenue</button>
                   <button className="px-5 py-2.5 bg-sp-bg text-sp-placeholder rounded-2xl text-[10px] font-black uppercase">Rating</button>
                </div>
             </div>
             
             <div className="grid md:grid-cols-2 gap-8">
                {/* Simulated Performance list */}
                <div className="space-y-4">
                   <p className="text-[10px] font-black text-sp-placeholder uppercase tracking-[0.2em] mb-6">Top Achievers</p>
                   {[1,2,3].map(i => (
                      <div key={i} className="flex items-center gap-4 p-4 bg-emerald-50/30 border border-emerald-100 rounded-2xl">
                         <div className="w-10 h-10 bg-white border border-emerald-200 rounded-xl flex items-center justify-center font-black text-emerald-600">#{i}</div>
                         <div className="flex-1">
                            <p className="text-xs font-black text-slate-800 uppercase">Verified Supplier {i}</p>
                            <div className="flex items-center gap-2 mt-1">
                               <span className="text-[9px] font-black text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-200">ELITE</span>
                               <span className="text-[9px] font-bold text-sp-placeholder">Rating: 4.9/5</span>
                            </div>
                         </div>
                         <ChevronRight className="text-sp-placeholder" size={16} />
                      </div>
                   ))}
                </div>
                <div className="space-y-4">
                   <p className="text-[10px] font-black text-sp-placeholder uppercase tracking-[0.2em] mb-6">High Risk Performance</p>
                   {[1,2].map(i => (
                      <div key={i} className="flex items-center gap-4 p-4 bg-rose-50/30 border border-rose-100 rounded-2xl">
                         <div className="w-10 h-10 bg-white border border-rose-200 rounded-xl flex items-center justify-center font-black text-rose-600">#4{i}</div>
                         <div className="flex-1">
                            <p className="text-xs font-black text-slate-800 uppercase">Lagging Partner {i}</p>
                            <div className="flex items-center gap-2 mt-1">
                               <span className="text-[9px] font-black text-rose-600 bg-rose-100 px-2 py-0.5 rounded-lg border border-rose-200">RISK</span>
                               <span className="text-[9px] font-bold text-sp-placeholder">Complaints: 12</span>
                            </div>
                         </div>
                         <ChevronRight className="text-sp-placeholder" size={16} />
                      </div>
                   ))}
                </div>
             </div>
         </div>
      </div>
    </div>
  )
}
