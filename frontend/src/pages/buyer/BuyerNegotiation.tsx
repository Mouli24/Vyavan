import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Phone, MoreVertical, Plus, Send, FileText, Loader2,
  CheckCircle, XCircle, MessageSquare, History, Sparkles,
  PenLine, ChevronRight, Zap, Package, ShieldCheck
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import BuyerNavbar from '@/components/layout/BuyerNavbar'

// ── Status colour maps ────────────────────────────────────────────────────────
const STATUS_PILL: Record<string, string> = {
  Negotiating:        'bg-amber-100 text-amber-700 font-black',
  Waiting:            'bg-slate-100 text-slate-600 font-black',
  'New Offer':        'bg-violet-100 text-violet-700 font-black',
  Accepted:           'bg-emerald-100 text-emerald-700 font-black',
  Rejected:           'bg-red-100 text-red-600 font-black',
  Expired:            'bg-slate-100 text-slate-400 font-black',
  'Converted to Order': 'bg-green-100 text-green-700 font-black',
}

const SUGGESTIONS = [
  '"Suppliers often accept a 3% price reduction if you commit to a 6-month recurring order volume."',
  '"Try requesting a sample before finalizing. It shows serious intent and can leverage better terms."',
  '"A 20% upfront deposit might help you secure the floor-price without further rounds."',
]

export default function BuyerNegotiation() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialProductId = searchParams.get('product')

  const [deals, setDeals] = useState<any[]>([])
  const [activeDeal, setActiveDeal] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sendingMsg, setSendingMsg] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [activeAction, setActiveAction] = useState<'negotiate' | 'reject' | null>(null)
  const [showContract, setShowContract] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    api.getBuyerDeals()
      .then(data => {
        const list = Array.isArray(data) ? data : []
        setDeals(list)
        if (list.length > 0) setActiveDeal(list[0])
      })
      .catch(() => setDeals([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!activeDeal?._id) return
    api.getMessages(activeDeal._id).then(setMessages).catch(console.error)
  }, [activeDeal?._id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || !activeDeal) return

    if (activeAction === 'reject') {
       await handleDealAction('Rejected', undefined, input)
       setActiveAction(null)
       setInput('')
       return
    }

    if (activeAction === 'negotiate') {
       const price = parseInt(input.replace(/[^0-9]/g, ''))
       if (isNaN(price)) {
         alert('Please enter a valid price for the counter-offer')
         return
       }
       await handleDealAction('Negotiating', price, 'Buyer sent a counter-offer')
       setActiveAction(null)
       setInput('')
       return
    }

    setSendingMsg(true)
    try {
      const msg = await api.sendMessage({ deal: activeDeal._id, content: input })
      setMessages(prev => [...prev, msg])
      setInput('')
    } catch (e) { console.error(e) }
    finally { setSendingMsg(false) }
  }

  const handleDealAction = async (status: string, requestedPrice?: number, customMessage?: string) => {
    if (!activeDeal) return
    let message = customMessage || ''

    if (status === 'Rejected' && !message) {
      setActiveAction('reject')
      setInput('')
      return
    }

    setUpdating(true)
    try {
      const updated = await api.updateDeal(activeDeal._id, { status, requestedPrice, message } as any)
      setDeals(prev => prev.map(d => d._id === updated._id ? { ...d, ...updated } : d))
      setActiveDeal(updated)
      setActiveAction(null)
      setInput('')
    } catch (e) { alert((e as any).message || 'Action failed') }
    finally { setUpdating(false) }
  }

  const handleActionInitiate = (action: 'negotiate' | 'reject') => {
    setActiveAction(action)
    setInput('')
    const chatInput = document.getElementById('chat-input')
    chatInput?.focus()
  }

  const handleConvertToOrder = async () => {
    if (!activeDeal) return
    setUpdating(true)
    try {
      await api.convertDealToOrder(activeDeal._id, {
        fullName: user?.name || '',
        phone: '—',
        addressLine1: user?.location || 'Main Street',
        city: 'City',
        state: 'State',
        pincode: '000000',
      })
      alert('Success! Negotiation converted to order.')
      navigate('/buyer/orders')
    } catch (e) { alert((e as any).message || 'Conversion failed') }
    finally { setUpdating(false) }
  }

  const suggestion = SUGGESTIONS[Math.floor((activeDeal?._id?.charCodeAt(0) || 0) % SUGGESTIONS.length)]

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-[#FAF8F5]">
        <BuyerNavbar activePage="negotiation" />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="w-7 h-7 animate-spin text-[#6B4E3D]" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#FAF8F5]">
      <BuyerNavbar activePage="negotiation" />
      <div className="flex flex-1 overflow-hidden bg-[#FAF8F5]">

      {/* ── LEFT: Active Deals ─────────────────────────────────────────────── */}
      <div className="w-72 flex-shrink-0 flex flex-col border-r bg-[#F5F2ED]" style={{ borderColor: '#E5E1DA' }}>
        <div className="px-5 py-5 flex items-center justify-between border-b" style={{ borderColor: '#E5E1DA' }}>
          <h2 className="text-base font-black tracking-tight text-[#1A1A1A]">Negotiations</h2>
          <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white bg-[#6B4E3D]">
            {deals.length}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {deals.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 text-[#C4B5A8]" />
              <p className="text-[10px] font-black uppercase text-[#A89F91]">No active threads</p>
            </div>
          ) : deals.map(deal => {
            const isActive = activeDeal?._id === deal._id
            return (
              <motion.div
                key={deal._id}
                whileHover={{ x: 2 }}
                onClick={() => setActiveDeal(deal)}
                className="p-4 rounded-[1.5rem] cursor-pointer transition-all border"
                style={{
                  background: isActive ? '#FFFFFF' : 'transparent',
                  borderColor: isActive ? '#D4C4B8' : 'transparent',
                  boxShadow: isActive ? '0 4px 12px rgba(107,78,61,0.08)' : 'none',
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#A89F91]">{deal.time || 'Active'}</span>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${STATUS_PILL[deal.status] || ''}`}>
                    {deal.status}
                  </span>
                </div>
                <p className="text-sm font-black mb-0.5 text-[#1A1A1A] truncate">
                  {deal.manufacturer?.company || deal.manufacturer?.name || 'Supplier'}
                </p>
                <p className="text-[10px] truncate text-[#A89F91] mb-3">{deal.title}</p>
                <p className="text-sm font-black text-[#6B4E3D]">{deal.price}</p>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* ── MIDDLE: Chat ───────────────────────────────────────────────────── */}
      {activeDeal ? (
        <div className="flex-1 flex flex-col min-w-0 bg-[#FAF8F5]">
          {/* Header */}
          <div className="flex-shrink-0 h-16 px-6 flex items-center justify-between border-b bg-white" style={{ borderColor: '#E5E1DA' }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black text-white bg-[#6B4E3D]">
                {(activeDeal.manufacturer?.company || activeDeal.manufacturer?.name || 'S').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-black leading-tight text-[#1A1A1A]">
                  {activeDeal.manufacturer?.company || activeDeal.manufacturer?.name}
                </p>
                <p className="text-[10px] font-black text-[#A89F91] uppercase tracking-widest">#{activeDeal._id?.slice(-6).toUpperCase()}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setShowHistory(!showHistory)} className={`p-2 rounded-xl transition-all ${showHistory ? 'bg-[#FCE7D6] text-[#6B4E3D]' : 'text-[#A89F91]'}`}>
                <History size={17} />
              </button>
              <button className="p-2 rounded-xl text-[#A89F91]"><Phone size={17} /></button>
              <button className="p-2 rounded-xl text-[#A89F91]"><MoreVertical size={17} /></button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            <AnimatePresence>
              {messages.map(msg => {
                const isMe = msg.senderRole === 'buyer'
                return (
                  <motion.div key={msg._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-sm px-5 py-3.5 text-sm leading-relaxed ${
                      isMe ? 'text-white rounded-[1.5rem] rounded-tr-sm bg-[#6B4E3D]' : 'text-gray-700 rounded-[1.5rem] rounded-tl-sm bg-white border border-[#E5E1DA]'
                    }`} style={{ boxShadow: isMe ? 'none' : '0 1px 4px rgba(0,0,0,0.05)' }}>
                      {msg.content}
                    </div>
                    <span className="text-[10px] mt-1 px-1 text-[#A89F91]">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </motion.div>
                )
              })}
            </AnimatePresence>

            {/* Special Order Conversion Card */}
            {activeDeal.status === 'Accepted' && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                className="max-w-sm mx-auto rounded-[2rem] p-6 border-2 border-emerald-500/20 bg-white"
                style={{ boxShadow: '0 8px 32px rgba(16,185,129,0.1)' }}>
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                  <ShieldCheck size={24} />
                </div>
                <h3 className="text-base font-black text-[#1A1A1A] mb-1">Deal Accepted!</h3>
                <p className="text-xs text-[#A89F91] mb-6">Price locked at <b>{activeDeal.price}</b>. You have 24 hours to proceed.</p>
                <button onClick={handleConvertToOrder} disabled={updating}
                  className="w-full h-14 rounded-2xl bg-emerald-600 text-white font-black uppercase tracking-widest text-xs hover:bg-emerald-700 transition-all flex items-center justify-center gap-2">
                  {updating ? <Loader2 size={16} className="animate-spin" /> : <Package size={16} />}
                  Confirm Order
                </button>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div className="flex-shrink-0 px-5 py-4 border-t bg-white" style={{ borderColor: '#E5E1DA' }}>
            {activeAction && (
              <div className="flex items-center gap-2 mb-2 px-4 py-1.5 rounded-xl bg-orange-50 border border-orange-100">
                <span className="text-[10px] font-black uppercase tracking-widest text-orange-600">
                  {activeAction === 'reject' ? 'State rejection reason' : 'Propose counter price'}
                </span>
                <button type="button" onClick={() => setActiveAction(null)} className="ml-auto text-[10px] font-bold text-orange-400">Cancel</button>
              </div>
            )}
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-[#F5F2ED] border border-[#E5E1DA]">
              <Plus size={18} className="text-[#A89F91]" />
              <input
                id="chat-input"
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder={activeAction === 'reject' ? "Reason for rejection..." : activeAction === 'negotiate' ? "Enter price (e.g. 12000)..." : "Type your message..."}
                className="flex-1 bg-transparent border-none focus:outline-none text-sm text-[#1A1A1A]"
              />
              <button onClick={handleSend} disabled={!input.trim() || sendingMsg}
                className="px-5 py-2 rounded-full text-xs font-black text-white hover:opacity-95 transition-all"
                style={{ background: activeAction ? '#EA580C' : '#6B4E3D' }}>
                {activeAction ? 'Confirm' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-[#FAF8F5]">
          <div className="text-center">
            <MessageSquare size={48} className="mx-auto mb-4 text-[#D4C4B8]" />
            <p className="text-xs font-black uppercase text-[#A89F91] tracking-widest">Select a thread to discuss</p>
          </div>
        </div>
      )}

      {/* ── RIGHT: Overview ────────────────────────────────────────────────── */}
      {activeDeal && (
        <div className="w-64 flex-shrink-0 border-l bg-white flex flex-col" style={{ borderColor: '#E5E1DA' }}>
          {showHistory ? (
            <div className="p-5 h-full overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-[#A89F91]">Price History</h3>
                 <button onClick={() => setShowHistory(false)}><XCircle size={16} className="text-[#C4B5A8]" /></button>
              </div>
              <div className="relative pl-4 space-y-6">
                <div className="absolute left-[7px] top-2 bottom-2 w-px bg-[#E5E1DA]" />
                {(activeDeal.negotiationHistory || []).map((h: any, i: number) => (
                  <div key={i} className="relative pl-6">
                    <div className={`absolute left-[-13px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-white ${h.offeredBy === 'buyer' ? 'bg-[#6B4E3D]' : 'bg-[#D4C4B8]'}`} />
                    <p className="text-[10px] font-black text-[#1A1A1A] mb-1">Round {h.round}</p>
                    <div className="bg-[#F5F2ED] rounded-xl p-3 border border-[#E5E1DA]">
                      <p className="text-sm font-black text-[#1A1A1A]">₹{h.price?.toLocaleString()}</p>
                      <p className="text-[9px] text-[#A89F91] mt-0.5 uppercase tracking-tighter font-black">By {h.offeredBy}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Product Info */}
              <div className="p-5 border-b border-[#F0EBE5]">
                 <div className="w-16 h-16 rounded-2xl bg-[#F5F2ED] mb-4 overflow-hidden border border-[#E5E1DA]">
                    {activeDeal.product?.image ? <img src={activeDeal.product.image} className="w-full h-full object-cover" /> : <Package size={24} className="m-auto mt-4 text-[#D4C4B8]" />}
                 </div>
                 <h4 className="text-sm font-black text-[#1A1A1A] mb-1 line-clamp-1">{activeDeal.product?.name || activeDeal.title}</h4>
                 <p className="text-[10px] font-black uppercase text-[#A89F91] tracking-widest">Qty: {activeDeal.quantity} Units</p>
              </div>

              {/* Quick Actions */}
              <div className="p-5 border-b border-[#F0EBE5]">
                <p className="text-[10px] font-black uppercase tracking-widest mb-4 text-[#A89F91]">Deal Actions</p>
                <div className="space-y-2">
                  <button onClick={() => handleDealAction('Accepted')} disabled={updating || activeDeal.status === 'Accepted' || activeDeal.status === 'Rejected'}
                    className="w-full py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100 disabled:opacity-40 flex items-center justify-center gap-2">
                    <CheckCircle size={14} /> Accept Price
                  </button>
                  <button onClick={() => handleActionInitiate('negotiate')} disabled={updating || activeDeal.status === 'Accepted' || activeDeal.status === 'Rejected'}
                    className="w-full py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all bg-[#F5F2ED] text-[#1A1A1A] hover:bg-[#E5E1DA] disabled:opacity-40 flex items-center justify-center gap-2">
                    <PenLine size={13} /> Counter Offer
                  </button>
                  <button onClick={() => setShowContract(true)}
                    className="w-full py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all bg-[#F5F2ED] text-[#1A1A1A] hover:bg-[#E5E1DA] flex items-center justify-center gap-2">
                    <FileText size={13} /> View Agreement
                  </button>
                  <button onClick={() => handleActionInitiate('reject')} disabled={updating || activeDeal.status === 'Accepted' || activeDeal.status === 'Rejected'}
                    className="w-full py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 disabled:opacity-40 flex items-center justify-center gap-2">
                    <XCircle size={13} /> Reject Deal
                  </button>
                </div>
              </div>

              {/* Suggestions */}
              <div className="p-5 mt-auto">
                 <div className="bg-[#F3F0FF] rounded-2xl p-4 border border-[#E9E4FF]">
                    <div className="flex items-center gap-2 mb-2 text-[#7C3AED]">
                       <Sparkles size={14} />
                       <span className="text-[10px] font-black tracking-widest uppercase">Smart Suggestion</span>
                    </div>
                    <p className="text-[11px] leading-relaxed italic text-[#5B21B6]">{suggestion}</p>
                 </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Contract Modal */}
      <AnimatePresence>
        {showContract && activeDeal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowContract(false)} className="absolute inset-0 bg-black/40 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="px-8 py-6 border-b flex items-center justify-between bg-[#F5F2ED]">
                <div>
                  <h2 className="text-xl font-black text-[#6B4E3D]">Provisional Agreement</h2>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#A89F91]">Ref: #{activeDeal._id?.slice(-8).toUpperCase()}</p>
                </div>
                <button onClick={() => setShowContract(false)} className="text-[#A89F91]"><XCircle size={24} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-[#A89F91] mb-2">Seller (Manufacturer)</h4>
                    <p className="text-sm font-black text-[#1A1A1A]">{activeDeal.manufacturer?.company}</p>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-[#A89F91] mb-2">Buyer (Customer)</h4>
                    <p className="text-sm font-black text-[#1A1A1A]">{user?.name} (You)</p>
                  </div>
                </div>
                <div className="border-t pt-8">
                  <h4 className="text-sm font-black text-[#6B4E3D] mb-4">Agreement Specifications</h4>
                  <div className="bg-[#FAF8F5] rounded-2xl p-5 border border-[#E5E1DA] space-y-3">
                    <div className="flex justify-between">
                       <span className="text-xs font-bold text-[#A89F91]">Item:</span>
                       <span className="text-sm font-black text-[#1A1A1A]">{activeDeal.product?.name || activeDeal.title}</span>
                    </div>
                    <div className="flex justify-between">
                       <span className="text-xs font-bold text-[#A89F91]">Quantity:</span>
                       <span className="text-sm font-black text-[#1A1A1A]">{activeDeal.quantity} Units</span>
                    </div>
                    <div className="flex justify-between pt-4 border-t border-[#E5E1DA]">
                       <span className="text-sm font-black uppercase tracking-widest text-[#6B4E3D]">Total Value:</span>
                       <span className="text-lg font-black text-[#6B4E3D]">₹{(activeDeal.requestedPrice * activeDeal.quantity).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <div className="text-[10px] text-[#A89F91] italic text-center">
                  This document serves as a digital letter of intent. Formal signature occurs during checkout.
                </div>
              </div>
              <div className="p-6 border-t flex justify-end gap-3 bg-[#FAF8F5]">
                <button onClick={() => setShowContract(false)} className="px-6 py-2.5 rounded-xl text-sm font-black text-[#6B4E3D] border border-[#D4C4B8]">Close</button>
                <button onClick={() => window.print()} className="px-6 py-2.5 rounded-xl text-sm font-black text-white bg-[#6B4E3D] shadow-lg shadow-[#6B4E3D]/20">Print</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </div>
    </div>
  )
}
