import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { api, Receivable } from '@/lib/api'
import { toast } from 'react-hot-toast'
import { Calendar } from 'lucide-react'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  record: Receivable | null
}

export default function MarkPaidModal({ isOpen, onClose, onSuccess, record }: Props) {
  const [loading, setLoading] = useState(false)
  const [amount, setAmount] = useState<string>('')
  const [method, setMethod] = useState('bank_transfer')
  const [ref, setRef] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    if (record) {
      setAmount(record.amount_due.toString())
    }
  }, [record, isOpen])

  async function handleConfirm() {
    if (!record) return
    const payAmt = parseFloat(amount)
    if (isNaN(payAmt) || payAmt <= 0) {
      toast.error('Enter a valid amount')
      return
    }
    if (payAmt > record.amount_due) {
      toast.error('Amount exceeds balance due')
      return
    }

    setLoading(true)
    try {
      await api.markPaymentPaid(record.id, {
        amount: payAmt,
        payment_method: method,
        transaction_ref: ref,
        payment_date: date
      })
      toast.success('Payment recorded successfully')
      onSuccess()
      onClose()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!record) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4">
          <div className="p-4 bg-purple-50 rounded-xl border border-purple-100 flex justify-between items-center">
            <div className="space-y-1">
              <p className="text-[10px] text-purple-600 font-bold uppercase tracking-wider">Amount Due</p>
              <p className="text-xl font-bold text-mfr-dark">Rs. {record.amount_due.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-mfr-dark">{record.buyer_name || 'Buyer'}</p>
              <p className="text-[10px] text-mfr-muted">Order ID: {record.order_id}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Payment Amount (Rs.)</Label>
              <Input 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Payment Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <Input 
                  type="date"
                  className="pl-9"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Payment Method</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger>
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="upi">UPI / Digital Wallet</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
                <SelectItem value="manual">Other / Cash</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Transaction Reference (Optional)</Label>
            <Input 
              placeholder="UTR Number, Cheque No, etc."
              value={ref}
              onChange={(e) => setRef(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleConfirm} 
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {loading ? 'Processing...' : 'Confirm Payment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
