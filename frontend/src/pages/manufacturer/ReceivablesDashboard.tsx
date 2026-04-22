import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { api, Receivable } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'react-hot-toast'
import { 
  AlertTriangle, CheckCircle2, Clock, DollarSign, 
  Search, Send, Wallet, Loader2, ListFilter,
  ArrowUpRight, Calculator, Calendar
} from 'lucide-react'
import MarkPaidModal from '@/features/payments/MarkPaidModal'

export default function ReceivablesDashboard() {
  const { user } = useAuth()
  const mfrId = user?._id || ''

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<{ list: Receivable[]; summary: any }>({ list: [], summary: {} })
  const [filters, setFilters] = useState({ status: 'all', buyer_id: '' })
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<Receivable | null>(null)

  useEffect(() => {
    if (mfrId) {
      fetchReceivables()
    }
  }, [mfrId, filters])

  async function fetchReceivables() {
    setLoading(true)
    try {
      const res = await api.getReceivables(mfrId, filters)
      setData(res)
    } catch (err: any) {
      toast.error('Failed to load receivables')
    } finally {
      setLoading(false)
    }
  }

  async function handleSendReminder(recordId: string) {
    try {
      await api.sendPaymentReminder(recordId)
      toast.success('Reminder sent successfully')
    } catch (err: any) {
      toast.error('Failed to send reminder')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'overdue': return <Badge className="bg-red-100 text-red-600 hover:bg-red-100 border-none font-bold">OVERDUE</Badge>
      case 'paid': return <Badge className="bg-green-100 text-green-600 hover:bg-green-100 border-none font-bold">PAID</Badge>
      case 'partial': return <Badge className="bg-blue-100 text-blue-600 hover:bg-blue-100 border-none font-bold">PARTIAL</Badge>
      default: return <Badge className="bg-yellow-100 text-yellow-600 hover:bg-yellow-100 border-none font-bold">PENDING</Badge>
    }
  }

  return (
    <div className="p-6 lg:p-10 space-y-8 max-w-7xl mx-auto">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-mfr-dark">Receivables Dashboard</h1>
          <p className="text-sm text-mfr-muted mt-1">Track payments, manage debt, and send automated reminders.</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" className="border-mfr-border rounded-xl h-10 px-4">
             <Calendar size={16} className="mr-2" />
             Last 30 Days
           </Button>
           <Button variant="outline" className="border-mfr-border rounded-xl h-10 px-4">
             <Calculator size={16} className="mr-2" />
             Reports
           </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-mfr-border shadow-sm overflow-hidden">
          <CardContent className="p-6 flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold text-mfr-muted uppercase tracking-widest mb-1">Total Outstanding</p>
              <h4 className="text-2xl font-bold text-mfr-dark">Rs. {Number(data.summary.total_amount_due || 0).toLocaleString()}</h4>
              <div className="flex items-center gap-1 mt-2 text-green-600 font-medium text-[10px]">
                <ArrowUpRight size={12} />
                <span>+12.5% from last month</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
              <DollarSign size={20} />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-mfr-border shadow-sm overflow-hidden">
          <CardContent className="p-6 flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold text-mfr-muted uppercase tracking-widest mb-1">Overdue Count</p>
              <h4 className="text-2xl font-bold text-mfr-dark">{data.summary.overdue_count || 0} Orders</h4>
              <p className="text-[10px] text-mfr-muted mt-2">Requiring immediate follow-up</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
              <AlertTriangle size={20} />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-mfr-border shadow-sm overflow-hidden">
          <CardContent className="p-6 flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold text-mfr-muted uppercase tracking-widest mb-1">Due This Week</p>
              <h4 className="text-2xl font-bold text-mfr-dark">Rs. 45,200</h4>
              <p className="text-[10px] text-mfr-muted mt-2">Expected cash inflow</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Clock size={20} />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-mfr-border shadow-sm overflow-hidden">
          <CardContent className="p-6 flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold text-mfr-muted uppercase tracking-widest mb-1">Flagged Buyers</p>
              <h4 className="text-2xl font-bold text-mfr-dark">3 Accounts</h4>
              <p className="text-[10px] text-mfr-muted mt-2">Credit currently suspended</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
              <Wallet size={20} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-mfr-border flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-1 items-center gap-4 w-full">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-mfr-muted" size={16} />
            <Input 
              placeholder="Search buyer or order ID..." 
              className="pl-10 h-10 rounded-lg border-mfr-border focus:ring-purple-600"
            />
          </div>
          <Select 
            value={filters.status} 
            onValueChange={(val) => setFilters({ ...filters, status: val })}
          >
            <SelectTrigger className="w-36 h-10 rounded-lg border-mfr-border">
              <ListFilter size={14} className="mr-2" />
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button variant="ghost" className="text-mfr-muted text-xs h-10 font-semibold" onClick={() => setFilters({ status: 'all', buyer_id: '' })}>
            Clear Filters
          </Button>
          <Button onClick={fetchReceivables} className="bg-mfr-dark hover:bg-mfr-dark/90 h-10 px-6 font-semibold">
            Apply Filters
          </Button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-mfr-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-mfr-peach/30">
              <TableRow className="border-mfr-border">
                <TableHead className="text-[11px] font-bold text-mfr-muted uppercase py-4">Buyer & Order</TableHead>
                <TableHead className="text-[11px] font-bold text-mfr-muted uppercase py-4">Total Value</TableHead>
                <TableHead className="text-[11px] font-bold text-mfr-muted uppercase py-4 text-orange-700">Amount Due</TableHead>
                <TableHead className="text-[11px] font-bold text-mfr-muted uppercase py-4">Due Date</TableHead>
                <TableHead className="text-[11px] font-bold text-mfr-muted uppercase py-4">Status</TableHead>
                <TableHead className="text-[11px] font-bold text-mfr-muted uppercase py-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-20 text-center">
                    <Loader2 className="animate-spin inline-block text-purple-600" size={32} />
                  </TableCell>
                </TableRow>
              ) : data.list.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3 opacity-30">
                      <CheckCircle2 size={64} />
                      <p className="text-sm font-medium">Everything looks clear! No outstanding payments found.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                data.list.map((r) => (
                  <TableRow 
                    key={r.id} 
                    className={`
                      border-mfr-border transition-colors
                      ${r.status === 'overdue' ? 'bg-red-50/30' : 'hover:bg-mfr-peach/10'}
                    `}
                  >
                    <TableCell className="py-4 font-semibold text-mfr-dark">
                      <div className="flex flex-col">
                        <span>{r.buyer_name || 'Individual Merchant'}</span>
                        <span className="text-[10px] font-normal text-mfr-muted">Order ID: {r.order_id}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-medium py-4">Rs. {Number(r.total_amount).toLocaleString()}</TableCell>
                    <TableCell className="text-xs font-bold text-orange-700 py-4">Rs. {Number(r.amount_due).toLocaleString()}</TableCell>
                    <TableCell className="py-4">
                       <div className="flex flex-col">
                         <span className="text-xs font-medium">{new Date(r.due_date).toLocaleDateString()}</span>
                         {r.status === 'overdue' && (
                           <span className="text-[10px] text-red-600 font-bold">{r.days_overdue} days late</span>
                         )}
                       </div>
                    </TableCell>
                    <TableCell className="py-4">{getStatusBadge(r.status)}</TableCell>
                    <TableCell className="text-right py-4 space-x-2">
                       <Button 
                         variant="outline" 
                         size="sm" 
                         className="h-8 border-purple-200 text-purple-700 hover:bg-purple-100 hover:text-purple-800 font-semibold"
                         onClick={() => { setSelectedRecord(r); setIsModalOpen(true); }}
                       >
                         Mark Paid
                       </Button>
                       <Button 
                         variant="ghost" 
                         size="icon" 
                         className="h-8 w-8 text-mfr-muted hover:text-blue-600 hover:bg-blue-50"
                         onClick={() => handleSendReminder(r.id)}
                       >
                         <Send size={14} />
                       </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <MarkPaidModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchReceivables}
        record={selectedRecord}
      />
    </div>
  )
}
