import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/lib/api'
import { 
  ShoppingBag, Search, Filter, Download, MoreVertical, 
  ChevronRight, Calendar, User, Building2, CreditCard,
  Loader, Eye, Box, MapPin, Truck, AlertCircle, Clock
} from 'lucide-react'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import toast from 'react-hot-toast'

export default function AdminOrders() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [sector, setSector] = useState('all')

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const res = await api.getAdminOrders({ 
        page, 
        status, 
        search,
        sector: sector === 'all' ? undefined : sector
      })
      setData(res.data)
      setTotal(res.total)
    } catch (err) {
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => fetchOrders(), 300)
    return () => clearTimeout(timer)
  }, [page, status, search, sector])

  const getStatusStyle = (s: string) => {
    switch(s) {
      case 'Delivered': return 'bg-emerald-50 border-emerald-100 text-emerald-600'
      case 'Shipped':   return 'bg-sp-purple-pale border-sp-purple/10 text-sp-purple'
      case 'Confirmed': return 'bg-blue-50 border-blue-100 text-blue-600'
      case 'Cancelled': return 'bg-rose-50 border-rose-100 text-rose-600'
      default:          return 'bg-amber-50 border-amber-100 text-amber-600'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-sp-text tracking-tight flex items-center gap-3">
             Transactional Ledger
             <ShoppingBag className="text-sp-purple" size={24} />
          </h1>
          <p className="text-[10px] font-black text-sp-muted uppercase tracking-widest mt-1">Platform-wide procurement monitoring</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/admin/orders/stuck" className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 text-white rounded-2xl text-xs font-black hover:opacity-90 transition-all shadow-lg shadow-rose-200">
             <AlertCircle size={14} /> STUCK ORDERS
          </Link>
          <button className="p-2.5 bg-white border border-sp-border rounded-xl text-sp-placeholder hover:text-sp-text transition-all">
            <Download size={18} />
          </button>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-sp-placeholder filter-grayscale transition-all group-focus-within:text-sp-purple" size={18} />
          <input 
            type="text" 
            placeholder="Search by Order ID, Buyer, or Manufacturer..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-sp-border-light rounded-[24px] text-sm font-bold text-sp-text focus:outline-none focus:border-shadow transition-all"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select 
            value={status} 
            onChange={e => setStatus(e.target.value)}
            className="px-4 py-3.5 bg-white border-2 border-sp-border-light rounded-[20px] text-xs font-black text-sp-text outline-none uppercase"
          >
            <option value="all">ALL STATUS</option>
            <option value="New">PENDING</option>
            <option value="Confirmed">CONFIRMED</option>
            <option value="Shipped">SHIPPED</option>
            <option value="Delivered">DELIVERED</option>
            <option value="Cancelled">CANCELLED</option>
          </select>
          <select 
            value={sector} 
            onChange={e => setSector(e.target.value)}
            className="px-4 py-3.5 bg-white border-2 border-sp-border-light rounded-[20px] text-xs font-black text-sp-text outline-none uppercase"
          >
            <option value="all">ALL SECTORS</option>
            <option value="Textiles">TEXTILES</option>
            <option value="Electronics">ELECTRONICS</option>
            <option value="Furniture">FURNITURE</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[40px] border-2 border-sp-border-light shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-sp-bg/40">
              <tr className="border-b border-sp-border-light">
                <th className="py-5 px-8 text-[10px] font-black uppercase tracking-widest text-sp-placeholder">Order Ref</th>
                <th className="py-5 px-3 text-[10px] font-black uppercase tracking-widest text-sp-placeholder">Parties</th>
                <th className="py-5 px-3 text-[10px] font-black uppercase tracking-widest text-sp-placeholder">Fulfillment</th>
                <th className="py-5 px-3 text-[10px] font-black uppercase tracking-widest text-sp-placeholder text-center">Value Items</th>
                <th className="py-5 px-3 text-[10px] font-black uppercase tracking-widest text-sp-placeholder text-right">Status</th>
                <th className="py-5 px-8 text-right text-[10px] font-black uppercase tracking-widest text-sp-placeholder">Action</th>
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
                  <td colSpan={6} className="py-20 text-center opacity-40 italic font-bold text-sm">No transactions found</td>
                </tr>
              ) : (
                data.map(o => (
                  <tr key={o._id} className="hover:bg-sp-bg/20 transition-all group">
                    <td className="py-5 px-8">
                       <p className="text-xs font-black text-indigo-600 tracking-tighter">#{o.orderId}</p>
                       <div className="flex items-center gap-1 mt-1 text-[10px] font-bold text-sp-placeholder uppercase">
                          <Clock size={10} /> {new Date(o.createdAt).toLocaleDateString()}
                       </div>
                    </td>
                    <td className="py-5 px-3">
                       <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                             <div className="w-5 h-5 bg-sp-bg rounded flex items-center justify-center text-[8px] font-black text-sp-purple">B</div>
                             <p className="text-[11px] font-bold text-sp-text truncate max-w-[120px]">{o.buyer.company || o.buyer.name}</p>
                          </div>
                          <div className="flex items-center gap-2">
                             <div className="w-5 h-5 bg-sp-purple-pale rounded flex items-center justify-center text-[8px] font-black text-sp-purple">M</div>
                             <p className="text-[11px] font-bold text-sp-text truncate max-w-[120px]">{o.mfrInfo?.company}</p>
                          </div>
                       </div>
                    </td>
                    <td className="py-5 px-3">
                       <div className="flex items-center gap-1.5">
                          <MapPin size={12} className="text-sp-placeholder" />
                          <span className="text-[11px] font-medium text-sp-muted">{o.deliveryAddress?.city}</span>
                       </div>
                       <div className="flex items-center gap-1.5 mt-1">
                          <Truck size={12} className="text-sp-placeholder" />
                          <span className="text-[10px] font-black text-sp-placeholder uppercase">Express</span>
                       </div>
                    </td>
                    <td className="py-5 px-3 text-center">
                       <p className="text-xs font-black text-sp-text">₹{(o.valueRaw || 0).toLocaleString()}</p>
                       <p className="text-[10px] font-bold text-sp-placeholder uppercase tracking-tight">{o.items}</p>
                    </td>
                    <td className="py-5 px-3 text-right">
                       <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getStatusStyle(o.status)}`}>
                          {o.status}
                       </span>
                    </td>
                    <td className="py-5 px-8 text-right">
                      <Link to={`/admin/orders/${o._id}`} className="p-2 text-sp-placeholder hover:text-sp-purple transition-all inline-block group-hover:translate-x-1">
                         <ChevronRight size={20} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-6 border-t-2 border-sp-border-light flex items-center justify-between bg-sp-bg/5">
          <p className="text-[10px] font-black text-sp-placeholder uppercase tracking-widest">Showing {data.length} of {total} orders</p>
          <div className="flex items-center gap-2">
            <button 
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-5 py-2.5 bg-white border border-sp-border rounded-2xl text-[10px] font-black text-sp-muted hover:text-sp-text disabled:opacity-40 transition-all shadow-sm"
            >
               PREV
            </button>
            <button 
              disabled={page * 20 >= total}
              onClick={() => setPage(p => p + 1)}
              className="px-5 py-2.5 bg-white border border-sp-border rounded-2xl text-[10px] font-black text-sp-muted hover:text-sp-text disabled:opacity-40 transition-all shadow-sm"
            >
               NEXT
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
