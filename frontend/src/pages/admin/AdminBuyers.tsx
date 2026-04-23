import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/lib/api'
import { 
  Users, Search, Filter, Download, MoreVertical, 
  ChevronRight, ArrowUpDown, Building2, MapPin, 
  Calendar, ShoppingBag, Wallet, Clock, Loader, Eye,
  Ban, ShieldAlert, CheckCircle, XCircle
} from 'lucide-react'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import toast from 'react-hot-toast'

export default function AdminBuyers() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [type, setType] = useState('all')
  const [sortBy, setSortBy] = useState('newest')

  const fetchBuyers = async () => {
    setLoading(true)
    try {
      const res = await api.getAdminBuyers({ 
        page, 
        status, 
        search, 
        type: type === 'all' ? undefined : type,
        sortBy 
      })
      setData(res.data)
      setTotal(res.total)
    } catch (err) {
      toast.error('Failed to load buyers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => fetchBuyers(), 300)
    return () => clearTimeout(timer)
  }, [page, status, search, type, sortBy])

  const exportCSV = () => {
     const headers = ['Company', 'Name', 'Email', 'Type', 'Orders', 'Spent', 'Status', 'Joined']
     const rows = data.map(b => [
        b.company || 'N/A',
        b.name,
        b.email,
        b.profile?.businessType || 'Retailer',
        b.profile?.stats?.orderCount || 0,
        b.profile?.stats?.totalSpent || 0,
        b.isVerified ? 'Approved' : 'Pending',
        new Date(b.createdAt).toLocaleDateString()
     ])
     const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n")
     const link = document.createElement("a")
     link.setAttribute("href", encodeURI(csvContent))
     link.setAttribute("download", `buyers_export_${Date.now()}.csv`)
     document.body.appendChild(link)
     link.click()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-sp-text tracking-tight flex items-center gap-3">
            Buyer Ecosystem
            <span className="px-2.5 py-1 bg-sp-bg border border-sp-border rounded-xl text-xs font-black text-sp-purple">{total} TOTAL</span>
          </h1>
          <p className="text-xs font-bold text-sp-muted mt-1 uppercase tracking-wider">Procurement entities and retail partners</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/admin/buyers/verification" className="flex items-center gap-2 px-5 py-2.5 bg-sp-purple text-white rounded-2xl text-xs font-black hover:opacity-90 transition-all shadow-lg shadow-sp-purple/20">
             <ShieldAlert size={14} /> VERIFICATION QUEUE
          </Link>
          <button onClick={exportCSV} className="p-2.5 bg-white border border-sp-border rounded-xl text-sp-placeholder hover:text-sp-text transition-all">
            <Download size={18} />
          </button>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-sp-placeholder group-focus-within:text-sp-purple transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search by company, name, or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-sp-border-light rounded-[24px] text-sm font-bold text-sp-text focus:outline-none focus:border-sp-purple/20 transition-all"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select 
            value={status} 
            onChange={e => setStatus(e.target.value)}
            className="px-4 py-3.5 bg-white border-2 border-sp-border-light rounded-[20px] text-xs font-black text-sp-text outline-none focus:border-sp-purple/20"
          >
            <option value="all">ALL STATUS</option>
            <option value="approved">APPROVED</option>
            <option value="pending">PENDING</option>
          </select>
          <select 
            value={type} 
            onChange={e => setType(e.target.value)}
            className="px-4 py-3.5 bg-white border-2 border-sp-border-light rounded-[20px] text-xs font-black text-sp-text outline-none focus:border-sp-purple/20"
          >
            <option value="all">ALL TYPES</option>
            <option value="Wholesaler">WHOLESALER</option>
            <option value="Retailer">RETAILER</option>
            <option value="Distributor">DISTRIBUTOR</option>
          </select>
          <div className="flex items-center gap-2 bg-white border-2 border-sp-border-light rounded-[20px] px-2 py-1">
             <button 
                onClick={() => setSortBy('newest')}
                className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${sortBy === 'newest' ? 'bg-sp-purple text-white shadow-md' : 'text-sp-placeholder hover:text-sp-text'}`}
             >
                Newest
             </button>
             <button 
                onClick={() => setSortBy('spent')}
                className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${sortBy === 'spent' ? 'bg-indigo-600 text-white shadow-md' : 'text-sp-placeholder hover:text-sp-text'}`}
             >
                Spent
             </button>
             <button 
                onClick={() => setSortBy('orders')}
                className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${sortBy === 'orders' ? 'bg-emerald-600 text-white shadow-md' : 'text-sp-placeholder hover:text-sp-text'}`}
             >
                Orders
             </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[36px] border-2 border-sp-border-light shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-sp-bg/30">
              <tr className="border-b border-sp-border-light">
                <th className="text-left py-5 px-7 text-[10px] font-black uppercase tracking-widest text-sp-placeholder">Buyer Entity</th>
                <th className="text-left py-5 px-3 text-[10px] font-black uppercase tracking-widest text-sp-placeholder">Segments</th>
                <th className="text-left py-5 px-3 text-[10px] font-black uppercase tracking-widest text-sp-placeholder">Location</th>
                <th className="text-center py-5 px-3 text-[10px] font-black uppercase tracking-widest text-sp-placeholder">Metrics</th>
                <th className="text-right py-5 px-3 text-[10px] font-black uppercase tracking-widest text-sp-placeholder">Status</th>
                <th className="text-right py-5 px-7 text-[10px) font-black uppercase tracking-widest text-sp-placeholder">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sp-border-light">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <Loader size={32} className="text-sp-purple animate-spin mx-auto" />
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center opacity-40 italic font-bold text-sm uppercase">No matching buyers found</td>
                </tr>
              ) : (
                data.map(b => (
                  <tr key={b._id} className="hover:bg-sp-bg/20 transition-all group">
                    <td className="py-5 px-7">
                      <Link to={`/admin/buyers/${b._id}`} className="block">
                         <p className="text-sm font-black text-sp-text group-hover:text-sp-purple transition-colors">{b.company || b.name}</p>
                         <p className="text-[10px] font-bold text-sp-placeholder mt-0.5">{b.email}</p>
                      </Link>
                    </td>
                    <td className="py-5 px-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-sp-bg border border-sp-border rounded text-[9px] font-black text-sp-purple uppercase">{b.profile?.businessType || 'Retailer'}</span>
                        <span className="text-[9px] font-bold text-sp-placeholder uppercase tracking-tighter">JOINED {new Date(b.createdAt).getFullYear()}</span>
                      </div>
                    </td>
                    <td className="py-5 px-3">
                      <div className="flex items-center gap-1.5 text-sp-muted font-bold text-xs">
                        <MapPin size={14} className="text-sp-placeholder" />
                        {b.addresses?.[0]?.city || 'N/A'}
                      </div>
                    </td>
                    <td className="py-5 px-3">
                      <div className="flex flex-col items-center">
                         <p className="text-xs font-black text-sp-text">₹{(b.profile?.stats?.totalSpent || 0).toLocaleString()}</p>
                         <p className="text-[9px] font-bold text-sp-placeholder uppercase tracking-tighter">{b.profile?.stats?.orderCount || 0} Orders</p>
                      </div>
                    </td>
                    <td className="py-5 px-3 text-right">
                       <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                          b.isVerified ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-amber-50 border-amber-100 text-amber-600'
                       }`}>
                          {b.isVerified ? 'Approved' : 'Pending'}
                       </span>
                    </td>
                    <td className="py-5 px-7 text-right">
                       <DropdownMenu>
                          <DropdownMenuTrigger className="p-2 hover:bg-sp-bg rounded-xl transition-all outline-none">
                             <MoreVertical size={18} className="text-sp-placeholder" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52 p-2 rounded-2xl border-2 border-sp-border-light shadow-xl">
                             <DropdownMenuItem asChild>
                                <Link to={`/admin/buyers/${b._id}`} className="flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-xl cursor-pointer hover:bg-sp-bg">
                                   <Eye size={16} /> View Profile
                                </Link>
                             </DropdownMenuItem>
                             <DropdownMenuItem className="flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-xl cursor-pointer hover:bg-rose-50 text-rose-600">
                                <Ban size={16} /> Suspend Access
                             </DropdownMenuItem>
                          </DropdownMenuContent>
                       </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-5 border-t-2 border-sp-border-light flex items-center justify-between bg-sp-bg/10">
          <p className="text-[10px] font-black text-sp-placeholder uppercase tracking-widest">Showing {data.length} of {total} entities</p>
          <div className="flex items-center gap-2">
            <button 
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 bg-white border border-sp-border rounded-xl text-[10px] font-black text-sp-muted hover:text-sp-text disabled:opacity-40 transition-all shadow-sm"
            >
               PREV
            </button>
            <button 
              disabled={page * 20 >= total}
              onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 bg-white border border-sp-border rounded-xl text-[10px] font-black text-sp-muted hover:text-sp-text disabled:opacity-40 transition-all shadow-sm"
            >
               NEXT
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
