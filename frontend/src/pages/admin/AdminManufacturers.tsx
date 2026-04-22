import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Link } from 'react-router-dom'
import {
  Factory, CheckCircle, XCircle, Eye, Search,
  MapPin, Calendar, AlertCircle, Shield, Filter,
  Download, ChevronDown
} from 'lucide-react'

const STATUS_FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Suspended', value: 'suspended' },
]

const PLAN_FILTERS = ['All', 'Free', 'Basic', 'Premium']

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
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [plan, setPlan] = useState('All')
  const [page, setPage] = useState(1)

  const fetchData = async () => {
    setLoading(true)
    try {
      const data = await api.getAdminManufacturers({ 
        status: statusFilter, 
        limit: 50,
        page,
        name: search,
        city,
        state,
        plan: plan !== 'All' ? plan : undefined
      })
      setManufacturers(data.data ?? [])
      setTotal(data.total ?? 0)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData()
    }, 300)
    return () => clearTimeout(timer)
  }, [search, statusFilter, city, state, plan, page])

  const exportCSV = () => {
    if (manufacturers.length === 0) return
    const headers = ['Name', 'Company', 'Email', 'Location', 'Status', 'Plan', 'GST', 'Registered']
    const rows = manufacturers.map(m => [
      `"${m.name}"`, 
      `"${m.company || ''}"`, 
      m.email, 
      `"${m.location || ''}"`, 
      m.manufacturerStatus, 
      m.profile?.planType || 'Free',
      m.profile?.gstNumber || 'N/A',
      new Date(m.createdAt).toLocaleDateString()
    ])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `manufacturers_export_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Manufacturers</h1>
          <p className="text-slate-400 font-bold text-sm mt-0.5">{total} total accounts</p>
        </div>
        <button 
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-amber-600 transition-colors shadow-lg shadow-slate-200"
        >
          <Download size={14} />
          Export CSV
        </button>
      </div>

      {/* Advanced Filters */}
      <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search name, company, or email..."
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          
          <div className="flex bg-slate-50 border border-slate-100 rounded-2xl p-1">
            {STATUS_FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                  statusFilter === f.value
                    ? 'bg-white text-amber-600 shadow-sm'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
            <Filter size={14} className="text-slate-400" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Advanced</span>
          </div>
          
          <input
            type="text" placeholder="City..."
            className="w-32 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:border-amber-500"
            value={city} onChange={e => setCity(e.target.value)}
          />
          <input
            type="text" placeholder="State..."
            className="w-32 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:border-amber-500"
            value={state} onChange={e => setState(e.target.value)}
          />
          
          <div className="relative">
             <select 
               value={plan} 
               onChange={e => setPlan(e.target.value)}
               className="appearance-none pl-4 pr-10 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium text-slate-700 outline-none focus:border-amber-500"
             >
                {PLAN_FILTERS.map(p => <option key={p} value={p}>{p} Plan</option>)}
             </select>
             <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
             <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-4 border-amber-100 border-t-amber-600 rounded-full animate-spin" />
                <p className="text-xs font-bold tracking-widest uppercase text-slate-400">Loading Data...</p>
             </div>
          </div>
        ) : manufacturers.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <Factory className="w-12 h-12 mx-auto mb-4 text-slate-200" />
            <p className="font-bold text-sm">No manufacturers match your filters</p>
            <button onClick={() => {setSearch(''); setCity(''); setState(''); setPlan('All'); setStatusFilter('all')}} className="mt-4 text-xs font-bold text-amber-600 hover:underline">Clear Filters</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50/50 border-b border-slate-100">
                <tr>
                  <th className="text-left py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Manufacturer</th>
                  <th className="text-left py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest hidden md:table-cell">Location</th>
                  <th className="text-center py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Plan</th>
                  <th className="text-left py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status / GST</th>
                  <th className="text-right py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {manufacturers.map((m) => (
                  <tr key={m._id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-100 rounded-[14px] flex items-center justify-center text-slate-600 font-black text-sm flex-shrink-0 group-hover:bg-amber-100 group-hover:text-amber-700 transition-colors">
                          {m.name?.[0] ?? 'M'}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-800">{m.name}</p>
                          <p className="text-xs font-bold text-slate-400 mt-0.5">{m.company}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 hidden md:table-cell">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                        <MapPin className="w-3.5 h-3.5 text-slate-300" />
                        {m.location || m.profile?.address?.city || 'Not specified'}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                       <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wider uppercase border text-slate-600 opacity-80 ${
                          m.profile?.planType === 'Premium' ? 'border-indigo-200 bg-indigo-50 text-indigo-700' :
                          m.profile?.planType === 'Basic' ? 'border-sky-200 bg-sky-50 text-sky-700' : 'border-slate-200 bg-white'
                       }`}>
                          {m.profile?.planType || 'Free'}
                       </span>
                    </td>
                    <td className="py-4 px-6">
                       <div className="flex flex-col items-start gap-2">
                          <StatusBadge status={m.manufacturerStatus ?? 'pending'} />
                          {m.profile?.gstNumber ? (
                             <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                                <Shield className="w-3 h-3 text-emerald-500" /> {m.profile.gstNumber}
                             </span>
                          ) : (
                             <span className="text-[10px] font-medium text-rose-400">GST Pending</span>
                          )}
                       </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end">
                        <Link
                          to={`/admin/manufacturers/${m._id}`}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-900 text-slate-600 hover:text-white text-xs font-bold rounded-xl transition-all"
                        >
                          View Profile
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
