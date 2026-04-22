import { useState, useEffect } from 'react'
import { api, PaymentTerm } from '@/lib/api'
import { 
  Shield, Calendar, Split, AlertCircle, 
  AlertTriangle, Loader2, Info
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

interface Props {
  mfrId: string
  buyerId: string
  orderAmount: number
  onSelect: (term: PaymentTerm) => void
  selectedTerm?: PaymentTerm
}

const TERM_DETAILS: Record<PaymentTerm, { label: string; desc: string; icon: any }> = {
  advance_100: { 
    label: 'Pay in Full Now', 
    desc: '100% payment required before order is processed', 
    icon: Shield 
  },
  split_50_50: { 
    label: 'Split Payment (50-50)', 
    desc: '50% now, remaining 50% due within 15 days of delivery', 
    icon: Split 
  },
  net_15: { 
    label: 'Net 15', 
    desc: 'Full payment due within 15 days of order delivery', 
    icon: Calendar 
  },
  net_30: { 
    label: 'Net 30', 
    desc: 'Full payment due within 30 days of order delivery', 
    icon: Calendar 
  },
}

export default function PaymentTermsSelector({ mfrId, buyerId, orderAmount, onSelect, selectedTerm }: Props) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<{ 
    available_terms: PaymentTerm[], 
    restricted: boolean, 
    reason: 'credit_limit' | 'overdue_flag' | null 
  } | null>(null)

  useEffect(() => {
    fetchTerms()
  }, [mfrId, buyerId, orderAmount])

  async function fetchTerms() {
    setLoading(true)
    try {
      const res = await api.getCheckoutAvailableTerms({
        mfr_id: mfrId,
        buyer_id: buyerId,
        order_amount: orderAmount
      })
      setData(res)
      
      // Auto-select first available if none selected
      if (res.available_terms.length > 0 && !selectedTerm) {
        onSelect(res.available_terms[0])
      }
    } catch (err) {
      console.error('Failed to fetch terms', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-10 bg-slate-100 rounded-xl w-full" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="h-24 bg-slate-50 rounded-2xl border border-slate-100" />
          <div className="h-24 bg-slate-50 rounded-2xl border border-slate-100" />
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {data.restricted && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`
              p-4 rounded-xl border flex gap-3
              ${data.reason === 'overdue_flag' 
                ? 'bg-red-50 border-red-100 text-red-800' 
                : 'bg-amber-50 border-amber-100 text-amber-800'}
            `}
          >
            {data.reason === 'overdue_flag' ? (
              <AlertCircle size={20} className="shrink-0 text-red-600" />
            ) : (
              <AlertTriangle size={20} className="shrink-0 text-amber-600" />
            )}
            <div className="space-y-1">
              <p className="text-sm font-bold">
                {data.reason === 'overdue_flag' 
                  ? 'Payment Overdue Notice' 
                  : 'Credit Limit Reached'}
              </p>
              <p className="text-xs leading-relaxed opacity-90 font-medium">
                {data.reason === 'overdue_flag'
                  ? 'You have overdue payments with this supplier. Clear your dues to access credit terms. Advance payment is currently required.'
                  : 'Your credit limit with this manufacturer has been reached. Advance payment is required for this order.'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Object.entries(TERM_DETAILS).map(([key, info]) => {
          const isAvailable = data.available_terms.includes(key as PaymentTerm)
          const isSelected = selectedTerm === key
          const Icon = info.icon

          return (
            <div
              key={key}
              onClick={() => isAvailable && onSelect(key as PaymentTerm)}
              className={`
                relative p-4 rounded-2xl border-2 transition-all group flex flex-col justify-between h-full
                ${!isAvailable ? 'opacity-50 grayscale bg-slate-50 border-slate-200 cursor-not-allowed' : 'cursor-pointer'}
                ${isSelected ? 'border-purple-600 bg-purple-50/30' : 'border-slate-100 hover:border-purple-200 bg-white'}
              `}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-2 rounded-xl border ${isSelected ? 'bg-purple-600 text-white border-purple-600' : 'bg-slate-50 text-slate-400 group-hover:text-purple-600 group-hover:border-purple-200'}`}>
                  <Icon size={18} />
                </div>
                {isSelected && (
                  <div className="w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center border-2 border-white shadow-sm scale-110">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-2 h-2 bg-white rounded-full" />
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <p className={`text-sm font-bold ${isSelected ? 'text-purple-900' : 'text-slate-700'}`}>{info.label}</p>
                <p className="text-[10px] text-slate-500 leading-relaxed font-medium">{info.desc}</p>
              </div>

              {!isAvailable && (
                <div className="mt-2 flex items-center gap-1 text-[9px] text-slate-400 italic">
                  <Info size={10} /> Not available for this order
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
