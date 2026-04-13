import { useState, useEffect } from 'react'
import {
  TrendingUp, Package, Loader2, FileText, Upload, Calendar,
  Edit, ArrowRightLeft, CheckCircle2, History,
  Search, Bell, Globe, HelpCircle, MoreHorizontal, ChevronLeft, ChevronRight,
  Plus, ArrowRight
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import { api, Order } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { useNavigate } from 'react-router-dom'

const STATUS_COLORS: Record<string, string> = {
  'In Production': 'bg-orange-50 text-orange-600 border-orange-100',
  'Pending Payment': 'bg-blue-50 text-blue-600 border-blue-100',
  'Shipped': 'bg-green-50 text-green-600 border-green-100',
  'Delivered': 'bg-emerald-50 text-emerald-600 border-emerald-100',
  'Cancelled': 'bg-red-50 text-red-600 border-red-100',
}

const DOT_COLORS: Record<string, string> = {
  'In Production': 'bg-orange-500',
  'Pending Payment': 'bg-blue-500',
  'Shipped': 'bg-green-500',
  'Delivered': 'bg-emerald-500',
  'Cancelled': 'bg-red-500',
}

const PAGE_SIZE = 5

export default function ManufacturerOrders() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showModModal, setShowModModal] = useState(false)
  const [showDispatchModal, setShowDispatchModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  useEffect(() => {
    Promise.all([
      api.getOrders().catch(() => []),
      api.getManufacturerStats().catch(() => null)
    ])
      .then(([ordersData, statsData]) => {
        setOrders(Array.isArray(ordersData) ? ordersData : [])
        setStats(statsData)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleStatusChange = async (orderId: string, status: string, extra: any = {}) => {
    try {
      if (status === 'Confirmed') {
        await api.confirmOrder(orderId)
      } else if (status === 'Rejected') {
        const reason = extra.reason || prompt('Please provide a rejection reason:')
        if (!reason) return
        await api.rejectOrder(orderId, reason)
      } else if (status === 'Packed') {
        await api.packOrder(orderId)
      } else if (status === 'Shipped') {
        await api.dispatchOrder(orderId, {
          carrier: extra.carrier,
          trackingNumber: extra.tracking,
          invoiceUrl: extra.invoiceUrl,
          lorryReceiptUrl: extra.lrUrl
        })
      } else if (status === 'Modification Suggested') {
        // Mock API call
        await new Promise(r => setTimeout(r, 1000))
        alert('Modification request sent to buyer!')
      } else {
        await api.updateOrderStatus(orderId, status)
      }
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: status as Order['status'] } : o))
      setShowModModal(false)
      setShowDispatchModal(false)
    } catch (e: any) {
      alert(e.message || 'Failed to update status')
    }
  }

  // Filter
  const filtered = orders.filter(o => {
    const matchTab =
      activeTab === 'all' ||
      (activeTab === 'production' && o.status === 'In Production') ||
      (activeTab === 'shipped' && o.status === 'Shipped') ||
      (activeTab === 'pending' && o.status === 'Pending Payment')
    const matchSearch =
      !search ||
      o.orderId.toLowerCase().includes(search.toLowerCase()) ||
      o.buyer?.name?.toLowerCase().includes(search.toLowerCase()) ||
      o.items?.toLowerCase().includes(search.toLowerCase())
    return matchTab && matchSearch
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  const newOrderCount = stats?.todayOrderCount ?? 0
  const pendingShipments = stats?.pendingShipments ?? 0
  const todayRevenue = stats?.todayRevenue ?? 0

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      {/* ── Topbar ── */}
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Dashboard</span>
          <span className="text-muted-foreground">/</span>
          <span className="font-semibold">Orders</span>
        </div>

        <div className="flex items-center gap-6">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              placeholder="Search orders, customers..."
              className="pl-10 bg-card border-none shadow-sm rounded-full h-11 focus-visible:ring-primary/20"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
            />
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-secondary">
              <Globe size={20} className="text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-secondary">
              <HelpCircle size={20} className="text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-secondary relative">
              <Bell size={20} className="text-muted-foreground" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-background" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-8" />

          <div className="flex items-center gap-3 pl-2">
            <div className="text-right">
              <p className="text-sm font-bold">{user?.name || 'User'}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">{user?.role || 'Member'}</p>
            </div>
            <Avatar className="h-10 w-10 border-2 border-primary/10">
              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.name || 'User'}`} />
              <AvatarFallback>{user?.name?.[0] || 'U'}</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      {/* ── Hero + Stats ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        <Card className="lg:col-span-8 bg-gradient-to-br from-[#F5E6D3] to-[#F9F1E7] border border-[#E5D5C0] shadow-card overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-white/20 transition-colors duration-500" />
          <CardContent className="p-8 relative z-10">
            <h2 className="text-3xl font-bold mb-2 tracking-tight leading-tight">
              You have {newOrderCount} new<br />orders to process.
            </h2>
            <p className="text-muted-foreground max-w-md mb-7 leading-relaxed text-sm">
              Most orders require shipment verification within the next 24 hours.
            </p>
            <div className="flex gap-3">
              <Button className="rounded-xl px-7 h-10 bg-[#5D4037] hover:bg-[#4E342E] text-white shadow-sm text-sm font-semibold">
                Review All Orders
              </Button>
              <Button variant="outline" className="rounded-xl px-7 h-10 bg-white/60 backdrop-blur-sm border-white/80 shadow-sm hover:bg-white text-sm font-semibold">
                Download Reports
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-4 flex flex-col gap-6">
          <Card className="bg-[#E3F2FD] border border-blue-100 shadow-card flex-1">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-primary/70 mb-2">
                <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
                  <TrendingUp size={16} />
                </motion.div>
                <span className="text-[10px] uppercase tracking-wider font-semibold">Revenue Today</span>
              </div>
              <p className="text-2xl font-bold mb-1 tracking-tight">₹{todayRevenue.toLocaleString()}</p>
              <p className="text-xs text-primary/60 font-medium">+12% from yesterday</p>
            </CardContent>
          </Card>

          <Card className="bg-[#F3E5F5] border border-purple-100 shadow-card flex-1">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-purple-700/70 mb-2">
                <Package size={16} />
                <span className="text-[10px] uppercase tracking-wider font-semibold">Pending Shipment</span>
              </div>
              <p className="text-2xl font-bold mb-1 tracking-tight">{pendingShipments} Orders</p>
              <p className="text-xs text-purple-700/60 font-medium">Avg. 1.2 days delay</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Active Orders Table ── */}
      <Card className="border border-border/50 shadow-card bg-card rounded-2xl overflow-hidden mb-8">
        <CardHeader className="p-8 pb-4 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold">Active Orders</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Real-time management of your manufacturing pipeline.</p>
          </div>
          <Tabs defaultValue="all" className="w-auto" onValueChange={v => { setActiveTab(v); setPage(1) }}>
            <TabsList className="bg-secondary/50 p-1 rounded-full h-11">
              <TabsTrigger value="all" className="rounded-full px-5">All Statuses</TabsTrigger>
              <TabsTrigger value="production" className="rounded-full px-5">In Production</TabsTrigger>
              <TabsTrigger value="shipped" className="rounded-full px-5">Shipped</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>

        <CardContent className="p-4 sm:p-8 pt-0">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-none">
                {['Order ID', 'Customer Details', 'Items & Value', 'Status', 'Expected Date', 'Actions'].map(h => (
                  <TableHead key={h} className={`text-[10px] uppercase tracking-widest font-bold text-muted-foreground/50 ${h === 'Actions' ? 'text-right' : ''}`}>
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence mode="popLayout">
                {paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-16 text-muted-foreground">
                      No orders found.
                    </TableCell>
                  </TableRow>
                ) : paginated.map((order, idx) => (
                  <motion.tr
                    key={order._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.04 }}
                    className="group border-b border-border/30 hover:bg-secondary/20 transition-colors"
                  >
                    <TableCell className="font-mono text-xs font-bold py-6">{order.orderId}</TableCell>

                    <TableCell className="py-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold ${idx % 2 === 0 ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                          {order.buyer?.initials || 'U'}
                        </div>
                        <div>
                          <p className="text-sm font-bold">{order.deliveryAddress?.companyName || order.buyer?.name || 'Unknown'}</p>
                          <p className="text-[10px] text-muted-foreground font-medium">{order.deliveryAddress ? `${order.deliveryAddress.city}, ${order.deliveryAddress.state}` : (order.buyer?.location || '—')}</p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="py-6">
                      <p className="text-sm font-bold">{order.items}</p>
                      <p className="text-[10px] text-muted-foreground font-medium">{order.value}</p>
                    </TableCell>

                    <TableCell className="py-6">
                      <Badge
                        variant="secondary"
                        className={`rounded-full px-3 py-1 text-[10px] font-bold flex items-center gap-1.5 w-fit ${STATUS_COLORS[order.status] ?? 'bg-gray-50 text-gray-600'}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${DOT_COLORS[order.status] ?? 'bg-gray-400'}`} />
                        {order.status}
                      </Badge>
                    </TableCell>

                    <TableCell className={`text-sm font-medium py-6 ${order.status === 'Shipped' ? 'line-through text-muted-foreground' : ''}`}>
                      {order.expectedDate}
                    </TableCell>

                    <TableCell className="text-right py-6">
                      <div className="flex items-center justify-end gap-2">
                         {order.status === 'New' && (
                          <>
                            <Button size="sm" variant="outline" className="rounded-full text-[10px] h-7 px-3 font-bold border-red-200 text-red-600 hover:bg-red-50" onClick={() => handleStatusChange(order._id, 'Rejected')}>
                              Reject
                            </Button>
                            <Button size="sm" variant="outline" className="rounded-full text-[10px] h-7 px-3 font-bold border-indigo-200 text-indigo-600 hover:bg-indigo-50" onClick={() => { setSelectedOrder(order); setShowModModal(true); }}>
                              Suggest Mod
                            </Button>
                            <Button size="sm" className="rounded-full text-[10px] h-7 px-3 font-bold bg-[#C47A2B] hover:bg-[#A0621A] text-white" onClick={() => handleStatusChange(order._id, 'Confirmed')}>
                              Accept
                            </Button>
                          </>
                        )}
                        {order.status === 'Confirmed' && (
                          <Button size="sm" variant="outline" className="rounded-full text-[10px] h-7 px-3 font-bold border-blue-200 text-blue-600 hover:bg-blue-50" onClick={() => handleStatusChange(order._id, 'Packed')}>
                            Mark Packed
                          </Button>
                        )}
                        {order.status === 'Packed' && (
                          <Button size="sm" className="rounded-full text-[10px] h-7 px-3 font-bold bg-green-600 hover:bg-green-700 text-white" onClick={() => { setSelectedOrder(order); setShowDispatchModal(true); }}>
                            Dispatch
                          </Button>
                        )}
                        {order.status === 'In Production' && (
                          <Button size="sm" className="rounded-full text-[10px] h-7 px-3 font-bold bg-green-600 hover:bg-green-700 text-white" onClick={() => { setSelectedOrder(order); setShowDispatchModal(true); }}>
                            Dispatch
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => { setSelectedOrder(order); setShowDetailsModal(true); }}>
                          <MoreHorizontal size={18} />
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </TableBody>
          </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-8">
            <p className="text-xs text-muted-foreground font-medium">
              Showing {Math.min(filtered.length, PAGE_SIZE * page - PAGE_SIZE + paginated.length)} of {filtered.length} orders
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost" size="icon"
                className="rounded-full w-8 h-8"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                <ChevronLeft size={16} />
              </Button>
              {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => i + 1).map(p => (
                <Button
                  key={p}
                  variant={page === p ? 'default' : 'ghost'}
                  size="icon"
                  className={`rounded-full w-8 h-8 ${page === p ? 'bg-[#5D4037] text-white hover:bg-[#4E342E]' : ''}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </Button>
              ))}
              <Button
                variant="ghost" size="icon"
                className="rounded-full w-8 h-8"
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                <ChevronRight size={16} />
              </Button>
              <Separator orientation="vertical" className="h-4 mx-2" />
              <Button size="icon" className="rounded-full w-10 h-10 bg-[#5D4037] hover:bg-[#4E342E] shadow-lg">
                <Plus size={20} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Bottom Insight Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
        <Card className="rounded-[2rem] border-none shadow-sm bg-card group cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-8">
            <h4 className="text-lg font-bold mb-3">Inventory Alert</h4>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              You have {stats?.totalProducts ?? 0} active products. Consider restocking before the next production batch starts.
            </p>
            <Button variant="link" className="p-0 h-auto text-foreground font-bold group-hover:gap-2 transition-all" onClick={() => navigate('/manufacturer/store')}>
              Manage Inventory <ArrowRight size={16} />
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-none shadow-sm bg-card group cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-8">
            <h4 className="text-lg font-bold mb-3">Shipping Optimization</h4>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              You can save on shipping by bundling pending orders. Fast processing increases your rating and visibility.
            </p>
            <Button variant="link" className="p-0 h-auto text-foreground font-bold group-hover:gap-2 transition-all" onClick={() => navigate('/manufacturer/shipment')}>
              View Logistics <ArrowRight size={16} />
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-none shadow-sm bg-card group cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-8">
            <h4 className="text-lg font-bold mb-3">New Inquiry</h4>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              You have {stats?.activeDeals ?? 0} active negotiation threads. Quick responses help in closing deals effectively.
            </p>
            <Button variant="link" className="p-0 h-auto text-foreground font-bold group-hover:gap-2 transition-all" onClick={() => navigate('/manufacturer/negotiation')}>
              Open Negotiation <ArrowRight size={16} />
            </Button>
          </CardContent>
        </Card>
      </div>
      <Separator orientation="vertical" className="h-4 mx-2" />
      
      {/* Modification Modal */}
      {showModModal && selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold mb-4">Suggest Modification</h3>
            <p className="text-sm text-muted-foreground mb-6">Suggest a change in quantity or delivery date for order {selectedOrder.orderId}.</p>
            <div className="space-y-4 mb-8">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">New Quantity</label>
                <Input type="number" defaultValue={parseInt(selectedOrder.items || '0')} placeholder="e.g. 150" className="rounded-xl border-slate-200" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">New Delivery Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <Input type="date" className="pl-10 rounded-xl border-slate-200" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Reason</label>
                <textarea className="w-full rounded-xl border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" rows={3} placeholder="Production delay, raw material shortage..." />
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" className="flex-1 rounded-xl" onClick={() => setShowModModal(false)}>Cancel</Button>
              <Button className="flex-1 rounded-xl bg-slate-900" onClick={() => handleStatusChange(selectedOrder._id, 'Modification Suggested')}>Send Suggestion</Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Dispatch Modal */}
      {showDispatchModal && selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold mb-4">Dispatch Order</h3>
            <div className="space-y-4 mb-8">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Carrier Name</label>
                <Input placeholder="BlueDart, FedEx, etc." className="rounded-xl border-slate-200" id="carrier" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Tracking ID</label>
                <Input placeholder="AWB12345678" className="rounded-xl border-slate-200" id="tracking" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Invoice URL</label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <Input placeholder="https://..." className="pl-10 rounded-xl border-slate-200 text-xs" id="invoiceUrl" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Lorry Receipt (LR)</label>
                  <div className="relative">
                    <Upload className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <Input placeholder="https://..." className="pl-10 rounded-xl border-slate-200 text-xs" id="lrUrl" />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" className="flex-1 rounded-xl" onClick={() => setShowDispatchModal(false)}>Cancel</Button>
              <Button className="flex-1 rounded-xl bg-green-600 hover:bg-green-700" onClick={() => {
                const carrier = (document.getElementById('carrier') as HTMLInputElement).value
                const tracking = (document.getElementById('tracking') as HTMLInputElement).value
                const invoiceUrl = (document.getElementById('invoiceUrl') as HTMLInputElement).value
                const lrUrl = (document.getElementById('lrUrl') as HTMLInputElement).value
                handleStatusChange(selectedOrder._id, 'Shipped', { carrier, tracking, invoiceUrl, lrUrl })
              }}>Confim Dispatch</Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowDetailsModal(false)}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={e => e.stopPropagation()} className="bg-white rounded-[2rem] p-8 w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-start mb-6">
               <div>
                  <h3 className="text-xl font-bold">Order {selectedOrder.orderId}</h3>
                  <Badge variant="secondary" className={`mt-2 rounded-full px-3 py-1 text-[10px] font-bold ${STATUS_COLORS[selectedOrder.status] ?? 'bg-gray-50 text-gray-600'}`}>
                    {selectedOrder.status}
                  </Badge>
               </div>
               <Button variant="ghost" size="icon" className="rounded-full w-8 h-8" onClick={() => setShowDetailsModal(false)}>
                 <span className="text-xl">×</span>
               </Button>
            </div>

            <div className="space-y-6">
              <div className="bg-secondary/30 rounded-2xl p-4 border border-border/50">
                 <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Delivery Address</h4>
                 {selectedOrder.deliveryAddress ? (
                   <div className="text-sm">
                      <p className="font-bold">{selectedOrder.deliveryAddress.fullName} {selectedOrder.deliveryAddress.companyName && `(${selectedOrder.deliveryAddress.companyName})`}</p>
                      <p className="text-muted-foreground mt-1">{selectedOrder.deliveryAddress.addressLine1}</p>
                      {selectedOrder.deliveryAddress.addressLine2 && <p className="text-muted-foreground">{selectedOrder.deliveryAddress.addressLine2}</p>}
                      <p className="text-muted-foreground">{selectedOrder.deliveryAddress.city}, {selectedOrder.deliveryAddress.state} {selectedOrder.deliveryAddress.pincode}</p>
                      <p className="mt-2 font-medium">📞 {selectedOrder.deliveryAddress.phone}</p>
                   </div>
                 ) : (
                   <p className="text-sm text-muted-foreground">No structured delivery address provided.</p>
                 )}
              </div>

              <div className="bg-secondary/30 rounded-2xl p-4 border border-border/50">
                 <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Order Items</h4>
                 <p className="text-sm font-bold">{selectedOrder.items}</p>
                 <p className="text-xs text-muted-foreground mt-1">Total Value: {selectedOrder.value}</p>
              </div>
            </div>
            
            <div className="mt-8 flex justify-end">
              <Button className="rounded-xl px-6" onClick={() => setShowDetailsModal(false)}>Close</Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

