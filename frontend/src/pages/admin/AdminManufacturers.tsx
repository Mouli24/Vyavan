import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Link } from 'react-router-dom'
import {
  Factory, CheckCircle, XCircle, Eye, Search,
  MapPin, Calendar, AlertCircle, Shield, Filter,
  Download, ChevronDown, MoreVertical, Ban, RefreshCw, BarChart3, Star
} from 'lucide-react'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import toast from 'react-hot-toast'

const STATUS_FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Suspended', value: 'suspended' },
]

const PLAN_FILTERS = ['All', 'Free', 'Basic', 'Premium']
const SECTORS = ['All', 'Textiles', 'Electronics', 'Footwear', 'Chemicals', 'Food & Bev', 'Automotive']

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    approved: 'bg-emerald-100 text-emerald-700',
    pending:  'bg-amber-100 text-amber-700',
    rejected: 'bg-rose-100 text-rose-700',
    suspended:'bg-slate-100 text-slate-600',
  }
  return (
    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${map[status] ?? 'bg-slate-100 text-slate-600'}`}>
      {status}
    </span>
  )
}

export default function AdminManufacturers() {
  const [manufacturers, setManufacturers] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [plan, setPlan] = useState('All')
  const [sector, setSector] = useState('All')
  const [sortBy, setSortBy] = useState('newest')
  const [page, setPage] = useState(1)

  const fetchData = async () => {
    setLoading(true)
    try {
      const data = await api.getAdminManufacturers({ 
        status: statusFilter, 
        limit: 20,
        page,
        name: search,
        city,
        state,
        plan: plan !== 'All' ? plan : undefined,
        sector: sector !== 'All' ? sector : undefined,
        sortBy
      })
      setManufacturers(data.data ?? [])
      setTotal(data.total ?? 0)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData()
    }, 400)
    return () => clearTimeout(timer)
  }, [search, statusFilter, city, state, plan, sector, sortBy, page])

  const handleSuspend = async (id: string, name: string) => {
    if (!window.confirm(`Suspend account for ${name}?`)) return
    try {
      await api.suspendManufacturer(id)
      toast.success('Manufacturer suspended')
      fetchData()
    } catch (e) {
      toast.error('Suspension failed')
    }
  }

  const exportCSV = () => {
    if (manufacturers.length === 0) return
    const headers = ['Company', 'Contact', 'Sector', 'Location', 'Plan', 'Status', 'GST', 'Revenue', 'Rating']
    const rows = manufacturers.map(m => [
      `"${m.company || m.name}"`, 
      `"${m.name}"`, 
      `"${m.profile?.sector || 'N/A'}"`, 
      `"${m.profile?.address?.city || m.location || ''}"`, 
      m.profile?.planType || 'Free',
      m.manufacturerStatus, 
      m.profile?.gstNumber || 'N/A',
      m.profile?.stats?.totalRevenue || 0,
      m.profile?.stats?.avgRating || 0
    ])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `manufacturers_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-sp-text tracking-tight flex items-center gap-2">
            <Factory className="w-5 h-5 text-sp-purple" /> Manufacturer List
          </h1>
          <p className="text-sp-muted text-sm mt-0.5">{total} registered vendor accounts</p>
        </div>
        <div className="flex gap-2">
           <button onClick={fetchData} className="p-2 bg-white border border-sp-border rounded-xl text-sp-muted hover:text-sp-purple transition-all shadow-sm">
             <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
           </button>
           <button 
             onClick={exportCSV}
             className="flex items-center gap-2 px-4 py-2 bg-white border border-sp-border text-sp-text text-sm font-semibold rounded-xl hover:bg-sp-bg transition-all shadow-sm"
           >
             <Download size={14} /> Export
           </button>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-sp-border-light shadow-card space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[280px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-sp-placeholder" />
            <input
              type="text"
              placeholder="Search company name, GST, or email..."
              className="w-full pl-10 pr-4 py-2.5 bg-sp-bg/50 border border-sp-border rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sp-purple/20 focus:border-sp-purple transition-all"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          
          <div className="flex bg-sp-bg/50 border border-sp-border rounded-xl p-1">
            {STATUS_FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  statusFilter === f.value
                    ? 'bg-white text-sp-purple shadow-sm'
                    : 'text-sp-muted hover:text-sp-text'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="relative group">
             <select 
               value={sortBy} 
               onChange={e => setSortBy(e.target.value)}
               className="appearance-none pl-10 pr-10 py-2.5 bg-sp-bg/50 border border-sp-border rounded-xl text-xs font-bold text-sp-text outline-none focus:border-sp-purple cursor-pointer"
             >
                <option value="newest">Newest First</option>
                <option value="revenue">Highest Revenue</option>
                <option value="rating">Best Rating</option>
             </select>
             <BarChart3 size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sp-placeholder pointer-events-none" />
             <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sp-placeholder pointer-events-none" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-sp-purple-pale/50 rounded-lg border border-sp-purple/10">
            <Filter size={12} className="text-sp-purple" />
            <span className="text-[10px] font-black text-sp-purple uppercase tracking-widest">Advanced</span>
          </div>
          
          <div className="relative">
             <select 
               value={sector} 
               onChange={e => setSector(e.target.value)}
               className="appearance-none pl-3 pr-8 py-2 bg-white border border-sp-border rounded-xl text-xs font-semibold text-sp-text outline-none focus:border-sp-purple"
             >
                {SECTORS.map(s => <option key={s} value={s}>{s} Industry</option>)}
             </select>
             <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-sp-placeholder pointer-events-none" />
          </div>

          <div className="relative">
             <select 
               value={plan} 
               onChange={e => setPlan(e.target.value)}
               className="appearance-none pl-3 pr-8 py-2 bg-white border border-sp-border rounded-xl text-xs font-semibold text-sp-text outline-none focus:border-sp-purple"
             >
                {PLAN_FILTERS.map(p => <option key={p} value={p}>{p} Plan</option>)}
             </select>
             <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-sp-placeholder pointer-events-none" />
          </div>
          
          <input
            type="text" placeholder="City..."
            className="w-28 px-3 py-2 bg-white border border-sp-border rounded-xl text-xs font-medium focus:outline-none focus:border-sp-purple placeholder:text-sp-placeholder"
            value={city} onChange={e => setCity(e.target.value)}
          />
          <input
            type="text" placeholder="State..."
            className="w-28 px-3 py-2 bg-white border border-sp-border rounded-xl text-xs font-medium focus:outline-none focus:border-sp-purple placeholder:text-sp-placeholder"
            value={state} onChange={e => setState(e.target.value)}
          />

          {(city || state || plan !== 'All' || sector !== 'All') && (
            <button 
              onClick={() => { setCity(''); setState(''); setPlan('All'); setSector('All') }}
              className="text-[10px] font-black text-sp-purple uppercase tracking-widest hover:underline ml-2"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-sp-border-light shadow-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
             <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-4 border-sp-purple-pale border-t-sp-purple rounded-full animate-spin" />
                <p className="text-[10px] font-black tracking-widest uppercase text-sp-placeholder">Syncing Manufacturers...</p>
             </div>
          </div>
        ) : manufacturers.length === 0 ? (
          <div className="text-center py-20 text-sp-muted">
            <Factory className="w-12 h-12 mx-auto mb-4 text-sp-border opacity-50" />
            <p className="font-bold text-sm">No manufacturers found matching filters</p>
            <button onClick={() => {setSearch(''); setCity(''); setState(''); setPlan('All'); setStatusFilter('all'); setSector('All')}} className="mt-4 text-xs font-bold text-sp-purple hover:underline">Clear all filters</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-sp-bg/60 border-b border-sp-border-light">
                <tr>
                  <th className="text-left py-4 px-6 text-[11px] font-semibold text-sp-muted uppercase tracking-wider">Manufacturer</th>
                  <th className="text-left py-4 px-6 text-[11px] font-semibold text-sp-muted uppercase tracking-wider hidden md:table-cell">Details</th>
                  <th className="text-center py-4 px-6 text-[11px] font-semibold text-sp-muted uppercase tracking-wider">Metrics</th>
                  <th className="text-left py-4 px-6 text-[11px] font-semibold text-sp-muted uppercase tracking-wider">Status</th>
                  <th className="text-right py-4 px-6 text-[11px] font-semibold text-sp-muted uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sp-border-light">
                {manufacturers.map((m) => (
                  <tr key={m._id} className="hover:bg-sp-bg/40 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 bg-white border border-sp-border rounded-xl flex items-center justify-center shadow-sm overflow-hidden flex-shrink-0 group-hover:border-sp-purple/30 transition-all">
                          {m.profile?.logo ? (
                             <img src={m.profile.logo} alt="" className="w-full h-full object-contain" />
                          ) : (
                             <span className="font-black text-sp-purple text-sm">{m.company?.[0] || m.name?.[0]}</span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-sp-text line-clamp-1">{m.company || m.name}</p>
                          <p className="text-xs text-sp-muted font-medium mt-0.5">{m.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 hidden md:table-cell">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-sp-muted">
                           <MapPin size={11} className="text-sp-placeholder" /> {m.profile?.address?.city || m.location || 'N/A'}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-sp-placeholder uppercase tracking-tight">
                           <Shield size={11} className={m.profile?.gstNumber ? 'text-emerald-500' : 'text-sp-border'} /> {m.profile?.gstNumber || 'GST Pending'}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                       <div className="flex flex-col items-center gap-1.5">
                          <div className="flex items-center gap-3">
                             <div className="text-center">
                                <p className="text-xs font-black text-sp-text">₹{( (m.profile?.stats?.totalRevenue || 0) / 1000).toFixed(1)}k</p>
                                <p className="text-[9px] font-bold text-sp-placeholder uppercase tracking-tighter">Revenue</p>
                             </div>
                             <div className="w-px h-6 bg-sp-border" />
                             <div className="text-center">
                                <p className="text-xs font-black text-indigo-600 flex items-center gap-0.5 justify-center">
                                   <Star size={10} className="fill-indigo-600" /> {m.profile?.stats?.avgRating || 0}
                                </p>
                                <p className="text-[9px] font-bold text-sp-placeholder uppercase tracking-tighter">Rating</p>
                             </div>
                          </div>
                       </div>
                    </td>
                    <td className="py-4 px-6">
                       <div className="flex flex-col items-start gap-1.5">
                          <StatusBadge status={m.manufacturerStatus ?? 'pending'} />
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                             m.profile?.planType === 'Premium' ? 'border-amber-200 bg-amber-50 text-amber-700' :
                             m.profile?.planType === 'Basic' ? 'border-sky-200 bg-sky-50 text-sky-700' : 'border-sp-border bg-white text-sp-muted'
                          }`}>
                             {m.profile?.planType || 'Free'}
                          </span>
                       </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/admin/manufacturers/${m._id}`}
                          className="px-3 py-1.5 bg-sp-purple-pale text-sp-purple text-xs font-bold rounded-lg hover:bg-sp-purple hover:text-white transition-all shadow-sm"
                        >
                          View
                        </Link>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger className="p-1.5 text-sp-placeholder hover:text-sp-text hover:bg-sp-bg rounded-lg transition-all outline-none">
                            <MoreVertical size={16} />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 rounded-xl border-sp-border-light shadow-xl p-1.5">
                            <DropdownMenuItem className="rounded-lg text-xs font-semibold py-2 cursor-pointer" asChild>
                              <Link to={`/admin/manufacturers/${m._id}`} className="flex items-center gap-2">
                                <Eye className="w-4 h-4" /> Full Profile
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="rounded-lg text-xs font-semibold py-2 cursor-pointer flex items-center gap-2">
                               <RefreshCw className="w-4 h-4 cursor-pointer" /> Update Plan
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-sp-border-light my-1" />
                            <DropdownMenuItem 
                              onClick={() => handleSuspend(m._id, m.company || m.name)}
                              className="rounded-lg text-xs font-semibold py-2 cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50 flex items-center gap-2"
                            >
                               <Ban className="w-4 h-4" /> Suspend Account
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {total > 20 && (
         <div className="flex items-center justify-center gap-4 pt-4">
            <button 
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 bg-white border border-sp-border rounded-xl text-xs font-bold disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-xs font-black text-sp-text">Page {page} of {Math.ceil(total / 20)}</span>
            <button 
              disabled={page >= Math.ceil(total / 20)}
              onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 bg-white border border-sp-border rounded-xl text-xs font-bold disabled:opacity-40"
            >
              Next
            </button>
         </div>
      )}
    </div>
  )
}
