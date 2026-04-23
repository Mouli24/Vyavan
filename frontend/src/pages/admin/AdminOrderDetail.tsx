import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '@/lib/api'
import { 
  ArrowLeft, ShoppingBag, Package, MapPin, Truck, 
  CreditCard, Shield, Clock, FileText, CheckCircle, 
  XCircle, AlertCircle, User, Building2, Phone, Mail,
  ChevronRight, Calendar, Loader, ExternalLink
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminOrderDetail() {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [adminNote, setAdminNote] = useState('')
  const [isSavingNote, setIsSavingNote] = useState(false)

  const fetchOrder = async () => {
    try {
      const data = await api.getAdminOrderDetail(id!)
      setOrder(data)
      setAdminNote(data.adminNotes || '')
    } catch (e) {
      toast.error('Failed to load order details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) fetchOrder()
  }, [id])

  const saveNote = async () => {
    setIsSavingNote(true)
    try {
      await api.updateOrderAdminNotes(id!, adminNote)
      toast.success('Internal notes updated')
    } catch (e) { toast.error('Failed to save notes') }
    finally { setIsSavingNote(false) }
  }

  const updateEscrow = async (status: string) => {
    if (!window.confirm(`Are you sure you want to change escrow status to ${status}?`)) return
    try {
      await api.updateOrderEscrow(id!, status)
      toast.success(`Escrow updated to ${status}`)
      fetchOrder()
    } catch (e) { toast.error('Escrow update failed') }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]"><Loader size={32} className="text-sp-purple animate-spin" /></div>
  )

  const getStatusColor = (s: string) => {
    switch(s) {
      case 'Delivered': return 'text-emerald-600 bg-emerald-50 border-emerald-100'
      case 'Shipped':   return 'text-sp-purple bg-sp-purple-pale border-sp-purple/10'
      case 'Cancelled': return 'text-rose-600 bg-rose-50 border-rose-100'
      default:          return 'text-amber-600 bg-amber-50 border-amber-100'
    }
  }

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
              Order Detail
              <span className="text-indigo-600">#{order.orderId}</span>
            </h1>
            <div className="flex items-center gap-3 mt-1">
               <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getStatusColor(order.status)}`}>
                  {order.status}
               </span>
               <span className="text-[10px] font-black text-sp-placeholder uppercase tracking-widest leading-none">Placed {new Date(order.createdAt).toLocaleString()}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <button className="px-4 py-2 bg-sp-bg border border-sp-border rounded-xl text-[10px] font-black text-sp-purple hover:bg-sp-purple hover:text-white transition-all">
              DOWNLOAD INVOICE
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
         {/* Main Details (Left/Center) */}
         <div className="xl:col-span-2 space-y-6">
            <div className="grid md:grid-cols-2 gap-6 text-slate-900 font-bold">
               {/* Buyer Card */}
               <div className="bg-white p-7 rounded-[40px] border-2 border-sp-border-light shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                     <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                        <User size={20} />
                     </div>
                     <h3 className="text-sm font-black uppercase tracking-widest">Buyer Entity</h3>
                  </div>
                  <div className="space-y-4">
                     <div>
                        <p className="text-lg font-black text-slate-800 leading-tight">{order.buyer.company || order.buyer.name}</p>
                        <p className="text-xs text-sp-placeholder font-bold uppercase mt-1">{order.buyer.name}</p>
                     </div>
                     <div className="pt-4 border-t border-sp-border-light space-y-2">
                        <p className="text-xs flex items-center gap-2"><Mail size={14} className="text-sp-placeholder" /> {order.manufacturer?.email}</p>
                        <p className="text-xs flex items-center gap-2"><Phone size={14} className="text-sp-placeholder" /> +91 {order.manufacturer?.phone}</p>
                        <p className="text-xs flex items-center gap-2"><MapPin size={14} className="text-sp-placeholder" /> {order.deliveryAddress?.city}, {order.deliveryAddress?.state}</p>
                     </div>
                     <Link to={`/admin/buyers/${order.buyer.ref}`} className="flex items-center justify-center w-full py-3 bg-sp-bg border border-sp-border rounded-2xl text-[10px] font-black text-sp-purple mt-4 hover:bg-sp-purple hover:text-white transition-all uppercase tracking-widest">
                        View Full Buyer Profile
                     </Link>
                  </div>
               </div>

               {/* Manufacturer Card */}
               <div className="bg-slate-900 p-7 rounded-[40px] text-white shadow-xl">
                  <div className="flex items-center gap-3 mb-6 text-slate-400">
                     <div className="w-10 h-10 bg-slate-800 text-slate-400 rounded-xl flex items-center justify-center">
                        <Building2 size={20} />
                     </div>
                     <h3 className="text-sm font-black uppercase tracking-widest">Supplier Node</h3>
                  </div>
                  <div className="space-y-4">
                     <div>
                        <p className="text-lg font-black text-white leading-tight">{order.manufacturer?.company}</p>
                        <p className="text-xs text-slate-500 font-bold uppercase mt-1">Ref ID: {order.manufacturer?._id.slice(-6)}</p>
                     </div>
                     <div className="pt-4 border-t border-slate-800 space-y-2 text-slate-400">
                        <p className="text-xs flex items-center gap-2 grayscale opacity-80"><Mail size={14} /> {order.manufacturer?.email}</p>
                        <p className="text-xs flex items-center gap-2 grayscale opacity-80"><Phone size={14} /> +91 {order.manufacturer?.phone}</p>
                        <p className="text-xs flex items-center gap-2 grayscale opacity-80"><MapPin size={14} /> {order.manufacturer?.location || 'New Delhi'}</p>
                     </div>
                     <Link to={`/admin/manufacturers/${order.manufacturer?._id}`} className="flex items-center justify-center w-full py-3 bg-slate-800 border border-slate-700 rounded-2xl text-[10px] font-black text-slate-400 mt-4 hover:bg-sp-purple hover:text-white hover:border-transparent transition-all uppercase tracking-widest">
                        Verify Supplier Details
                     </Link>
                  </div>
               </div>
            </div>

            {/* Product Summary */}
            <div className="bg-white rounded-[40px] border-2 border-sp-border-light shadow-sm overflow-hidden">
               <div className="p-7 border-b-2 border-sp-border-light flex items-center justify-between bg-sp-bg/20">
                  <h3 className="text-sm font-black text-sp-text uppercase tracking-widest flex items-center gap-3">
                     Manifest Details
                     <span className="px-2 py-0.5 bg-indigo-600 text-white rounded text-[9px] font-black">{order.products?.length || 1} SKU</span>
                  </h3>
               </div>
               <div className="p-7">
                  <table className="w-full">
                     <thead>
                        <tr className="text-left py-4 border-b border-sp-border-light">
                           <th className="pb-4 text-[10px] font-black uppercase text-sp-placeholder">Product Information</th>
                           <th className="pb-4 text-[10px] font-black uppercase text-sp-placeholder text-center">Qty</th>
                           <th className="pb-4 text-[10px] font-black uppercase text-sp-placeholder text-right">Unit Price</th>
                           <th className="pb-4 text-[10px] font-black uppercase text-sp-placeholder text-right">Subtotal</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-sp-border-light">
                        {order.products?.map((p: any, i: number) => (
                           <tr key={i} className="group">
                              <td className="py-5">
                                 <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-sp-bg rounded-2xl border border-sp-border overflow-hidden p-1">
                                       <img src={p.product.images?.[0] || 'https://placehold.co/100x100?text=P'} className="w-full h-full object-cover rounded-xl" />
                                    </div>
                                    <div>
                                       <p className="text-sm font-black text-sp-text">{p.product.name}</p>
                                       <p className="text-[10px] font-bold text-sp-placeholder uppercase mt-0.5 tracking-tight line-clamp-1">{p.product.description || 'Verified Quality'}</p>
                                    </div>
                                 </div>
                              </td>
                              <td className="py-5 text-center font-black text-sm text-sp-text">{p.quantity}</td>
                              <td className="py-5 text-right font-black text-xs text-sp-muted">₹{(p.product.price || 0).toLocaleString()}</td>
                              <td className="py-5 text-right font-black text-sm text-sp-text">₹{(p.quantity * (p.product.price || 0)).toLocaleString()}</td>
                           </tr>
                        ))}
                        {/* Legacy support for raw string items */}
                        {(!order.products || order.products.length === 0) && (
                           <tr>
                              <td className="py-8 font-black text-sp-text">{order.items}</td>
                              <td className="py-8 text-center">–</td>
                              <td className="py-8 text-right">–</td>
                              <td className="py-8 text-right font-black">₹{order.valueRaw?.toLocaleString()}</td>
                           </tr>
                        )}
                     </tbody>
                  </table>

                  <div className="mt-8 pt-8 border-t-2 border-sp-border-light grid md:grid-cols-2 gap-8">
                     <div className="space-y-4">
                        <div className="p-5 bg-sp-purple-pale/30 border-2 border-sp-purple/5 rounded-[28px] relative overflow-hidden">
                           <div className="relative z-10">
                              <p className="text-[10px] font-black text-sp-purple uppercase tracking-widest mb-4 flex items-center gap-2">
                                 <Shield size={14} /> Escrow Protection
                              </p>
                              <div className="flex items-center justify-between">
                                 <span className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-tight ${
                                    order.escrowStatus === 'Held' ? 'bg-amber-100 text-amber-700' : 
                                    order.escrowStatus === 'Released' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                 }`}>
                                    {order.escrowStatus || 'Pending Payment'}
                                 </span>
                                 <div className="flex gap-2">
                                    <button onClick={() => updateEscrow('Released')} className="p-2 bg-white border border-sp-border rounded-lg text-emerald-600 hover:bg-emerald-50 transition-all"><CheckCircle size={16}/></button>
                                    <button onClick={() => updateEscrow('Refunded')} className="p-2 bg-white border border-sp-border rounded-lg text-rose-600 hover:bg-rose-50 transition-all"><XCircle size={16}/></button>
                                 </div>
                              </div>
                           </div>
                           <Shield className="absolute bottom-0 right-0 text-sp-purple/5 -translate-x-1/4 translate-y-1/4" size={120} />
                        </div>
                     </div>
                     <div className="bg-sp-bg/30 p-7 rounded-[32px] space-y-4">
                        <div className="flex justify-between text-xs font-bold text-sp-placeholder uppercase tracking-wider">
                           <span>Subtotal</span>
                           <span>₹{(order.valueRaw * 0.82).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-xs font-bold text-sp-placeholder uppercase tracking-wider">
                           <span>GST (18%)</span>
                           <span>₹{(order.valueRaw * 0.18).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-lg font-black text-indigo-600 pt-4 border-t border-sp-border shadow-sm-white">
                           <span>GRAND TOTAL</span>
                           <span>₹{order.valueRaw?.toLocaleString()}</span>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>

         {/* Right Sidebar (Timeline & Notes) */}
         <div className="space-y-6">
            {/* Timeline */}
            <div className="bg-white p-8 rounded-[40px] border-2 border-sp-border-light shadow-sm">
               <h3 className="text-sm font-black text-sp-text uppercase tracking-widest mb-8 flex items-center gap-3">
                  Lifecycle Tracking
                  <History className="text-indigo-600" size={16} />
               </h3>
               <div className="relative space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-sp-border-light">
                  {/* System Placed */}
                  <div className="relative pl-8">
                     <div className="absolute left-0 top-1 w-6 h-6 bg-indigo-600 rounded-full border-4 border-white shadow-md z-10" />
                     <p className="text-xs font-black text-slate-800">Order Placed</p>
                     <p className="text-[10px] text-sp-placeholder font-bold uppercase mt-0.5">{new Date(order.createdAt).toLocaleString()}</p>
                  </div>
                  
                  {order.timeline?.map((t: any, i: number) => (
                     <div key={i} className="relative pl-8">
                        <div className="absolute left-0 top-1 w-6 h-6 bg-sp-purple rounded-full border-4 border-white shadow-md z-10" />
                        <p className="text-xs font-black text-slate-800">{t.status}</p>
                        <p className="text-[9px] text-sp-placeholder font-medium leading-relaxed italic mt-0.5">“{t.note || 'Status updated by partner'}”</p>
                        <p className="text-[10px] text-indigo-600 font-bold uppercase mt-1 tracking-tighter">{new Date(t.createdAt).toLocaleString()}</p>
                     </div>
                  ))}

                  {/* Current Active State */}
                  <div className="relative pl-8">
                     <div className="absolute left-0 top-1 w-6 h-6 bg-emerald-500 rounded-full border-4 border-white shadow-md z-10 animate-pulse" />
                     <p className="text-xs font-black text-emerald-600">Current Scope: {order.status}</p>
                     <p className="text-[10px] text-sp-placeholder font-bold uppercase mt-0.5 italic">Awaiting Next Sequence</p>
                  </div>
               </div>
            </div>

            {/* Admin Internal Notes */}
            <div className="bg-slate-900 p-8 rounded-[40px] text-white shadow-xl">
                <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-3">
                   Internal Admin Vault
                   <Lock size={16} />
                </h3>
                <p className="text-[10px] text-slate-500 leading-relaxed mb-4 uppercase font-bold tracking-tight">
                   Confidential notes restricted to administrative clearance levels only. Partners cannot see this.
                </p>
                <textarea 
                   className="w-full h-32 bg-slate-800 border border-slate-700 rounded-2xl p-4 text-xs font-medium focus:outline-none focus:border-indigo-500 transition-all text-slate-100 placeholder:text-slate-600"
                   placeholder="Log intervention details, payment verification notes, or partner negotiation nuances..."
                   value={adminNote}
                   onChange={e => setAdminNote(e.target.value)}
                />
                <button 
                  onClick={saveNote}
                  disabled={isSavingNote}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 transition-all rounded-2xl text-[10px] font-black uppercase mt-4 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                   {isSavingNote ? <Loader size={14} className="animate-spin" /> : <FileText size={14} />}
                   SYNC TO VAULT
                </button>
            </div>
         </div>
      </div>
    </div>
  )
}
