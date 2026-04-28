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
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { api, PaymentTerm, BuyerTerms } from '@/lib/api'
import { toast } from 'react-hot-toast'
import { Search } from 'lucide-react'
import { useDebounce } from 'use-debounce'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  mfrId: string
  editingTerms?: BuyerTerms | null
}

const TERM_OPTIONS: { value: PaymentTerm; label: string; desc: string }[] = [
  { value: 'advance_100', label: '100% Advance', desc: 'Full payment before production' },
  { value: 'split_50_50', label: '50-50 Split', desc: '50% advance, 50% before dispatch' },
  { value: 'net_15', label: 'Net 15', desc: 'Payment within 15 days of delivery' },
  { value: 'net_30', label: 'Net 30', desc: 'Payment within 30 days of delivery' },
]

export default function AddBuyerTermsModal({ isOpen, onClose, onSuccess, mfrId, editingTerms }: Props) {
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch] = useDebounce(searchTerm, 500)
  const [searchResults, setSearchResults] = useState<any[]>([])
  
  const [selectedBuyer, setSelectedBuyer] = useState<any | null>(null)
  const [allowedTerms, setAllowedTerms] = useState<PaymentTerm[]>(['advance_100'])
  const [creditLimit, setCreditLimit] = useState<string>('0')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (editingTerms) {
      setAllowedTerms(editingTerms.allowed_terms)
      setCreditLimit(editingTerms.credit_limit.toString())
      setNotes(editingTerms.notes || '')
      setSelectedBuyer(editingTerms.buyer || { id: editingTerms.buyer_id, name: 'Existing Buyer' })
    } else {
      setSelectedBuyer(null)
      setAllowedTerms(['advance_100'])
      setCreditLimit('0')
      setNotes('')
    }
  }, [editingTerms, isOpen])

  useEffect(() => {
    if (debouncedSearch && !editingTerms) {
      searchBuyers()
    }
  }, [debouncedSearch])

  async function searchBuyers() {
    try {
      const res = await api.getCompanies({ q: debouncedSearch, role: 'buyer' } as any)
      setSearchResults(res.data)
    } catch (err) {
      console.error('Search failed', err)
    }
  }

  async function handleSave() {
    if (!selectedBuyer) {
      toast.error('Please select a buyer')
      return
    }
    if (allowedTerms.length === 0) {
      toast.error('Select at least one allowed term')
      return
    }

    setLoading(true)
    try {
      const buyerId = editingTerms ? editingTerms.buyer_id : selectedBuyer._id || selectedBuyer.id
      await api.updateBuyerPaymentTerms(mfrId, buyerId, {
        allowed_terms: allowedTerms,
        credit_limit: parseFloat(creditLimit),
        notes
      })
      toast.success(editingTerms ? 'Terms updated' : 'Override added')
      onSuccess()
      onClose()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleTerm = (term: PaymentTerm) => {
    setAllowedTerms(prev => 
      prev.includes(term) 
        ? prev.filter(t => t !== term) 
        : [...prev, term]
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{editingTerms ? 'Edit Buyer Override' : 'Add Buyer Override'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Buyer Search */}
          <div className="space-y-2">
            <Label>Buyer</Label>
            {editingTerms ? (
              <div className="p-3 bg-gray-50 rounded-lg border font-medium text-gray-900">
                {selectedBuyer?.name}
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <Input 
                  placeholder="Search by company name..." 
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchResults.length > 0 && !selectedBuyer && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                    {searchResults.map(b => (
                      <button
                        key={b._id}
                        className="w-full text-left px-4 py-2 hover:bg-purple-50 text-sm"
                        onClick={() => {
                          setSelectedBuyer(b)
                          setSearchTerm(b.company || b.name)
                          setSearchResults([])
                        }}
                      >
                        {b.company || b.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Allowed Terms */}
          <div className="space-y-3">
            <Label>Allowed Payment Terms</Label>
            <div className="grid grid-cols-2 gap-3">
              {TERM_OPTIONS.map(opt => (
                <div 
                  key={opt.value}
                  className={`
                    flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer
                    ${allowedTerms.includes(opt.value) ? 'border-purple-600 bg-purple-50/50' : 'border-gray-200 hover:border-gray-300'}
                  `}
                  onClick={() => toggleTerm(opt.value)}
                >
                  <Checkbox 
                    id={opt.value} 
                    checked={allowedTerms.includes(opt.value)}
                    onCheckedChange={() => toggleTerm(opt.value)}
                  />
                  <div className="space-y-1">
                    <Label htmlFor={opt.value} className="text-xs font-semibold cursor-pointer">{opt.label}</Label>
                    <p className="text-[10px] text-gray-500 leading-tight">{opt.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Credit Limit */}
          <div className="space-y-2">
            <Label>Credit Limit (Rs.)</Label>
            <Input 
              type="number" 
              value={creditLimit}
              onChange={(e) => setCreditLimit(e.target.value)}
              placeholder="0.00"
            />
            <p className="text-[10px] text-gray-500 italic">Total outstanding limit for this buyer.</p>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Internal Notes (Optional)</Label>
            <Textarea 
              placeholder="Keep track of negotiation or history..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="resize-none h-20"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={loading} className="bg-purple-600 hover:bg-purple-700">
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
