import { useState, useEffect, useRef } from 'react'
import {
  Phone, MoreVertical, Plus, Send, FileText, Loader2,
  CheckCircle, XCircle, MessageSquare, History, Sparkles,
  PenLine, ChevronRight, Zap,
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { api } from '@/lib/api'

// ── Priority & Status colour maps ─────────────────────────────────────────────
const PRIORITY_STYLE: Record<string, { label: string; color: string; dot: string }> = {
  HIGH:     { label: 'High Priority',  color: 'text-red-600',    dot: 'bg-red-500' },
  STANDARD: { label: 'Standard',       color: 'text-blue-600',   dot: 'bg-blue-500' },
  NEW:      { label: 'New',            color: 'text-violet-600', dot: 'bg-violet-500' },
}

const STATUS_PILL: Record<string, string> = {
  Negotiating:        'bg-amber-100 text-amber-700',
  Waiting:            'bg-slate-100 text-slate-600',
  'New Offer':        'bg-violet-100 text-violet-700',
  Accepted:           'bg-emerald-100 text-emerald-700',
  Rejected:           'bg-red-100 text-red-600',
  Expired:            'bg-slate-100 text-slate-400',
  'Converted to Order': 'bg-green-100 text-green-700',
}

// ── Smart suggestions pool ────────────────────────────────────────────────────
const SUGGESTIONS = [
  '"Offering a 2% rebate on future orders might secure this deal without lowering the current unit price."',
  '"Buyer has responded quickly — they are likely motivated. Consider a small concession to close."',
  '"Payment terms extension to 45 days could be more attractive than a price reduction."',
]

export default function Negotiation() {
  const [deals, setDeals] = useState<any[]>([])
  const [activeDeal, setActiveDeal] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sendingMsg, setSendingMsg] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [quickReplies, setQuickReplies] = useState<any[]>([])
  const [showQuickReplies, setShowQuickReplies] = useState(false)
  const [counterPrice, setCounterPrice] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    api.getDeals()
      .then(data => {
        const list = Array.isArray(data) ? data : []
        setDeals(list)
        if (list.length > 0) setActiveDeal(list[0])
      })
      .catch(() => setDeals([]))
      .finally(() => setLoading(false))
    api.getQuickReplies().then(setQuickReplies).catch(console.error)
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
    setSendingMsg(true)
    try {
      const msg = await api.sendMessage({ deal: activeDeal._id, content: input })
      setMessages(prev => [...prev, msg])
      setInput('')
    } catch (e) { console.error(e) }
    finally { setSendingMsg(false) }
  }

  const handleDealAction = async (status: string, requestedPrice?: number) => {
    if (!activeDeal) return
    let message = ''
    if (status === 'Rejected') {
      const reason = prompt('Reason for rejection:')
      if (!reason) return
      message = reason
    }
    setUpdating(true)
    try {
      const updated = await api.updateDeal(activeDeal._id, { status, requestedPrice, message } as any)
      setDeals(prev => prev.map(d => d._id === updated._id ? { ...d, ...updated } : d))
      setActiveDeal(updated)
    } catch (e) { alert((e as any).message || 'Action failed') }
    finally { setUpdating(false) }
  }

  const suggestion = SUGGESTIONS[Math.floor((activeDeal?._id?.charCodeAt(0) || 0) % SUGGESTIONS.length)]

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center" style={{ background: '#FAF8F5' }}>
        <Loader2 className="w-7 h-7 animate-spin" style={{ color: '#6B4E3D' }} />
      </div>
    )
  }

  return (
    <div className="flex h-full overflow-hidden" style={{ background: '#FAF8F5' }}>

      {/* ── LEFT: Active Deals ─────────────────────────────────────────────── */}
      <div className="w-72 flex-shrink-0 flex flex-col border-r" style={{ borderColor: '#E5E1DA', background: '#F5F2ED' }}>
        {/* Header */}
        <div className="px-5 py-5 flex items-center justify-between border-b" style={{ borderColor: '#E5E1DA' }}>
          <h2 className="text-base font-bold" style={{ color: '#1A1A1A' }}>Active Deals</h2>
          <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ background: '#6B4E3D' }}>
            {deals.length}
          </span>
        </div>

        {/* Deal list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {deals.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-8 h-8 mx-auto mb-2" style={{ color: '#C4B5A8' }} />
              <p className="text-xs" style={{ color: '#A89F91' }}>No active negotiations</p>
            </div>
          ) : deals.map(deal => {
            const isActive = activeDeal?._id === deal._id
            const priority = deal.priority || 'STANDARD'
            const ps = PRIORITY_STYLE[priority] || PRIORITY_STYLE.STANDARD
            const initials = (deal.buyer?.company || deal.buyer?.name || 'B').slice(0, 2).toUpperCase()

            return (
              <motion.div
                key={deal._id}
                whileHover={{ x: 2 }}
                onClick={() => setActiveDeal(deal)}
                className="p-4 rounded-2xl cursor-pointer transition-all"
                style={{
                  background: isActive ? '#FFFFFF' : 'transparent',
                  border: isActive ? '1.5px solid #D4C4B8' : '1.5px solid transparent',
                  boxShadow: isActive ? '0 2px 12px rgba(107,78,61,0.08)' : 'none',
                }}
              >
                {/* Priority + time */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${ps.dot}`} />
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${ps.color}`}>{ps.label}</span>
                  </div>
                  <span className="text-[10px]" style={{ color: '#A89F91' }}>{deal.time}</span>
                </div>

                {/* Company name + subtitle */}
                <p className="text-sm font-bold mb-0.5 truncate" style={{ color: '#1A1A1A' }}>
                  {deal.buyer?.company || deal.buyer?.name || deal.title}
                </p>
                <p className="text-xs truncate mb-3" style={{ color: '#A89F91' }}>{deal.subtitle || deal.title}</p>

                {/* Status + price */}
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${STATUS_PILL[deal.status] || 'bg-slate-100 text-slate-600'}`}>
                    {deal.status}
                  </span>
                  <span className="text-sm font-bold" style={{ color: '#6B4E3D' }}>{deal.price}</span>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* ── MIDDLE: Chat ───────────────────────────────────────────────────── */}
      {activeDeal ? (
        <div className="flex-1 flex flex-col min-w-0">

          {/* Chat header */}
          <div className="flex-shrink-0 h-16 px-6 flex items-center justify-between border-b bg-white"
            style={{ borderColor: '#E5E1DA' }}>
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                style={{ background: '#6B4E3D' }}>
                {(activeDeal.buyer?.company || activeDeal.buyer?.name || 'B').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-bold leading-tight" style={{ color: '#1A1A1A' }}>
                  {activeDeal.buyer?.company || activeDeal.buyer?.name || activeDeal.title}
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px]" style={{ color: '#A89F91' }}>
                    Online · ID: #{activeDeal._id?.slice(-6).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="p-2 rounded-xl transition-colors"
                style={{ background: showHistory ? '#FCE7D6' : 'transparent', color: showHistory ? '#6B4E3D' : '#A89F91' }}
                title="Price History">
                <History size={17} />
              </button>
              <button
                onClick={() => setShowQuickReplies(!showQuickReplies)}
                className="p-2 rounded-xl transition-colors"
                style={{ background: showQuickReplies ? '#FCE7D6' : 'transparent', color: showQuickReplies ? '#6B4E3D' : '#A89F91' }}
                title="Quick Replies">
                <Zap size={17} />
              </button>
              <button className="p-2 rounded-xl transition-colors hover:bg-gray-100" style={{ color: '#A89F91' }}>
                <Phone size={17} />
              </button>
              <button className="p-2 rounded-xl transition-colors hover:bg-gray-100" style={{ color: '#A89F91' }}>
                <MoreVertical size={17} />
              </button>
            </div>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4" style={{ background: '#FAF8F5' }}>
            <AnimatePresence>
              {messages.map(msg => {
                const isMe = msg.senderRole === 'manufacturer'
                return (
                  <motion.div key={msg._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-sm px-5 py-3.5 text-sm leading-relaxed ${
                      isMe
                        ? 'text-white rounded-2xl rounded-tr-sm'
                        : 'text-gray-700 rounded-2xl rounded-tl-sm border'
                    }`}
                      style={{
                        background: isMe ? '#6B4E3D' : '#FFFFFF',
                        borderColor: isMe ? 'transparent' : '#E5E1DA',
                        boxShadow: isMe ? 'none' : '0 1px 4px rgba(0,0,0,0.05)',
                      }}>
                      {msg.content}
                    </div>
                    <span className="text-[10px] mt-1 px-1" style={{ color: '#A89F91' }}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </motion.div>
                )
              })}
            </AnimatePresence>

            {/* Deal Summary Card */}
            {activeDeal.priceRaw > 0 && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                className="max-w-sm mx-auto rounded-2xl p-5 border"
                style={{ background: '#FFFFFF', borderColor: '#E5E1DA', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-sm font-bold" style={{ color: '#6B4E3D' }}>Deal Summary Update</h3>
                  <FileText size={16} style={{ color: '#C4B5A8' }} />
                </div>
                <p className="text-xs mb-4 leading-relaxed" style={{ color: '#A89F91' }}>
                  The partner has proposed a counter-offer of{' '}
                  <span className="font-bold" style={{ color: '#1A1A1A' }}>
                    ₹{activeDeal.priceRaw?.toLocaleString('en-IN')}
                  </span>{' '}
                  with a 15% deposit.
                </p>

                {/* Price box */}
                <div className="rounded-xl px-4 py-3 mb-4 flex items-center justify-between"
                  style={{ background: '#F5F2ED' }}>
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wider mb-0.5" style={{ color: '#A89F91' }}>Current Proposal</p>
                    <p className="text-xl font-bold" style={{ color: '#1A1A1A' }}>
                      ₹{activeDeal.priceRaw?.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-50 text-emerald-600">
                    -4.7% change
                  </span>
                </div>

                {(activeDeal.status === 'New Offer' || activeDeal.status === 'Negotiating') && (
                  <>
                    <p className="text-xs text-center mb-3" style={{ color: '#A89F91' }}>Approved Transaction?</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => handleDealAction('Accepted')} disabled={updating}
                        className="py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
                        style={{ background: '#6B4E3D' }}>
                        Accept Offer
                      </button>
                      <button onClick={() => handleDealAction('Rejected')} disabled={updating}
                        className="py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                        style={{ border: '1.5px solid #D4C4B8', color: '#6B4E3D', background: 'transparent' }}>
                        Reject
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {/* Quick Replies panel */}
            <AnimatePresence>
              {showQuickReplies && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                  className="fixed right-[21rem] top-24 w-64 rounded-2xl overflow-hidden z-30"
                  style={{ background: '#FFFFFF', border: '1px solid #E5E1DA', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
                  <div className="px-4 py-3 flex items-center justify-between border-b" style={{ borderColor: '#E5E1DA', background: '#F5F2ED' }}>
                    <span className="text-xs font-bold" style={{ color: '#6B4E3D' }}>Quick Replies</span>
                    <button onClick={() => setShowQuickReplies(false)} style={{ color: '#A89F91' }}><XCircle size={15} /></button>
                  </div>
                  <div className="p-2 max-h-72 overflow-y-auto space-y-1">
                    {quickReplies.length === 0 ? (
                      <p className="text-xs text-center py-6" style={{ color: '#A89F91' }}>No templates yet</p>
                    ) : quickReplies.map(r => (
                      <button key={r._id} onClick={() => { setInput(r.message); setShowQuickReplies(false) }}
                        className="w-full text-left px-3 py-2.5 rounded-xl transition-colors hover:bg-amber-50">
                        <p className="text-[10px] font-bold mb-0.5" style={{ color: '#6B4E3D' }}>{r.title}</p>
                        <p className="text-xs line-clamp-2" style={{ color: '#A89F91' }}>{r.message}</p>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={messagesEndRef} />
          </div>

          {/* Input bar */}
          <div className="flex-shrink-0 px-5 py-4 border-t bg-white" style={{ borderColor: '#E5E1DA' }}>
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-full"
              style={{ background: '#F5F2ED', border: '1.5px solid #E5E1DA' }}>
              <button className="flex-shrink-0 transition-colors" style={{ color: '#A89F91' }}>
                <Plus size={18} />
              </button>
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Type your message or counter offer..."
                className="flex-1 bg-transparent border-none focus:outline-none text-sm"
                style={{ color: '#1A1A1A' }}
              />
              <button onClick={handleSend} disabled={!input.trim() || sendingMsg}
                className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold text-white transition-all disabled:opacity-50"
                style={{ background: '#6B4E3D' }}>
                {sendingMsg ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Send
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center flex-col gap-3" style={{ background: '#FAF8F5' }}>
          <MessageSquare className="w-10 h-10" style={{ color: '#C4B5A8' }} />
          <p className="text-sm font-medium" style={{ color: '#A89F91' }}>Select a deal to start negotiating</p>
        </div>
      )}

      {/* ── RIGHT: Deal Overview ───────────────────────────────────────────── */}
      {activeDeal && (
        <div className="w-64 flex-shrink-0 flex flex-col border-l overflow-y-auto"
          style={{ borderColor: '#E5E1DA', background: '#FFFFFF' }}>

          {showHistory ? (
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: '#A89F91' }}>Price History</h3>
                <button onClick={() => setShowHistory(false)} style={{ color: '#A89F91' }}>
                  <XCircle size={15} />
                </button>
              </div>
              <div className="relative pl-4 space-y-4">
                <div className="absolute left-[7px] top-2 bottom-2 w-px" style={{ background: '#E5E1DA' }} />
                {(activeDeal.negotiationHistory || []).map((h: any, idx: number) => (
                  <div key={idx} className="relative pl-5">
                    <div className="absolute left-[-13px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-white"
                      style={{ background: h.offeredBy === 'manufacturer' ? '#6B4E3D' : '#A89F91' }} />
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-[10px] font-bold" style={{ color: '#1A1A1A' }}>Round {h.round}</span>
                      <span className="text-[9px]" style={{ color: '#A89F91' }}>{new Date(h.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="rounded-xl p-3" style={{ background: '#F5F2ED' }}>
                      <p className="text-sm font-bold" style={{ color: '#1A1A1A' }}>₹{h.price?.toLocaleString('en-IN')}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: '#A89F91' }}>by {h.offeredBy}</p>
                    </div>
                  </div>
                ))}
                {(!activeDeal.negotiationHistory || activeDeal.negotiationHistory.length === 0) && (
                  <p className="text-xs pl-2" style={{ color: '#A89F91' }}>No history yet</p>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Deal Overview */}
              <div className="p-5 border-b" style={{ borderColor: '#F0EBE5' }}>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: '#A89F91' }}>Deal Overview</p>
                <div className="space-y-4">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: '#A89F91' }}>Proposed Price</p>
                    <p className="text-xl font-bold" style={{ color: '#1A1A1A' }}>{activeDeal.price || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: '#A89F91' }}>Margin %</p>
                    <p className="text-xl font-bold" style={{ color: '#1A1A1A' }}>
                      {activeDeal.margin ? `${activeDeal.margin}%` : '24.5%'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wider mb-2" style={{ color: '#A89F91' }}>Logistics Phase</p>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map(i => (
                          <div key={i} className="w-2 h-2 rounded-full"
                            style={{ background: i <= 2 ? '#6B4E3D' : '#E5E1DA' }} />
                        ))}
                      </div>
                      <span className="text-[10px] font-semibold" style={{ color: '#1A1A1A' }}>Shipment Pending</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: '#A89F91' }}>Round</p>
                    <p className="text-sm font-bold" style={{ color: '#1A1A1A' }}>
                      {activeDeal.round || 1} / {activeDeal.maxRounds || 5}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="p-5 border-b" style={{ borderColor: '#F0EBE5' }}>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: '#A89F91' }}>Quick Actions</p>
                <div className="space-y-2">
                  {/* Counter offer input */}
                  {(activeDeal.status === 'New Offer' || activeDeal.status === 'Negotiating') && (
                    <div className="flex gap-1.5 mb-3">
                      <input
                        type="number"
                        placeholder="Counter price"
                        value={counterPrice}
                        onChange={e => setCounterPrice(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl text-xs border focus:outline-none"
                        style={{ borderColor: '#E5E1DA', background: '#F5F2ED', color: '#1A1A1A' }}
                      />
                      <button
                        onClick={() => { if (counterPrice) { handleDealAction('Negotiating', parseInt(counterPrice)); setCounterPrice('') } }}
                        disabled={!counterPrice || updating}
                        className="px-3 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-50"
                        style={{ background: '#6B4E3D' }}>
                        Send
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => handleDealAction('Accepted')}
                    disabled={updating}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold transition-all disabled:opacity-50"
                    style={{ background: '#F5F2ED', color: '#1A1A1A' }}>
                    <PenLine size={14} /> Counter Offer
                  </button>
                  <button
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold transition-all"
                    style={{ background: '#F5F2ED', color: '#1A1A1A' }}>
                    <FileText size={14} /> View Contract
                  </button>
                  <button
                    onClick={() => handleDealAction('Rejected')}
                    disabled={updating}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold transition-all disabled:opacity-50"
                    style={{ background: '#FEF2F2', color: '#DC2626' }}>
                    <XCircle size={14} /> Reject Deal
                  </button>
                </div>
              </div>

              {/* Smart Suggestion */}
              <div className="p-5">
                <div className="rounded-2xl p-4" style={{ background: '#F3F0FF', border: '1px solid #E9E4FF' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles size={13} style={{ color: '#7C3AED' }} />
                    <span className="text-[10px] font-bold" style={{ color: '#7C3AED' }}>Smart Suggestion</span>
                  </div>
                  <p className="text-[11px] leading-relaxed italic" style={{ color: '#5B21B6' }}>
                    {suggestion}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
