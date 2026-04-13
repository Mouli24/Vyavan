import { useState, useEffect, useRef } from 'react';
import { Phone, MoreVertical, Plus, Send, FileText, Loader2, CheckCircle, XCircle, MessageSquare, History } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '@/lib/api';

const PRIORITY_COLORS: Record<string, string> = {
  HIGH: 'bg-red-100 text-red-600',
  STANDARD: 'bg-blue-100 text-blue-600',
  NEW: 'bg-sp-purple-pale text-sp-purple',
};

const STATUS_COLORS: Record<string, string> = {
  Negotiating: 'bg-amber-100 text-amber-700',
  Waiting: 'bg-slate-100 text-slate-600',
  'New Offer': 'bg-sp-purple-pale text-sp-purple',
  Accepted: 'bg-sp-mint text-sp-success',
  Rejected: 'bg-red-50 text-red-600',
  Expired: 'bg-slate-100 text-slate-400',
  'Converted to Order': 'bg-green-100 text-green-700',
};

export default function Negotiation() {
  const [deals, setDeals] = useState<any[]>([]);
  const [activeDeal, setActiveDeal] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMsg, setSendingMsg] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [quickReplies, setQuickReplies] = useState<any[]>([]);
  const [showQuickReplies, setShowQuickReplies] = useState(false);

  useEffect(() => {
    api.getDeals()
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setDeals(list);
        if (list.length > 0) setActiveDeal(list[0]);
      })
      .catch(err => {
        console.error(err);
        setDeals([]);
      })
      .finally(() => setLoading(false));

    api.getQuickReplies()
      .then(setQuickReplies)
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!activeDeal?._id) return;
    api.getMessages(activeDeal._id)
      .then(setMessages)
      .catch(console.error);
  }, [activeDeal?._id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !activeDeal) return;
    setSendingMsg(true);
    try {
      const msg = await api.sendMessage({ deal: activeDeal._id, content: input });
      setMessages(prev => [...prev, msg]);
      setInput('');
    } catch (e) {
      console.error(e);
    } finally {
      setSendingMsg(false);
    }
  };

  const useTemplate = (message: string) => {
    setInput(prev => prev ? `${prev} ${message}` : message);
    setShowQuickReplies(false);
  };

  const handleDealAction = async (status: string, requestedPrice?: number) => {
    if (!activeDeal) return;

    let message = '';
    if (status === 'Rejected') {
      const reason = prompt('Please provide a reason for rejection (mandatory):');
      if (!reason) return;
      message = reason;
    }

    setUpdating(true);
    try {
      const updated = await api.updateDeal(activeDeal._id, { status, requestedPrice, message });
      setDeals(prev => prev.map(d => d._id === updated._id ? { ...d, ...updated } : d));
      setActiveDeal(updated);
    } catch (e) {
      alert((e as any).message || 'Action failed');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-sp-purple animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden bg-background">
      {/* Active Deals Column */}
      <div className="w-80 border-r border-muted flex flex-col bg-muted/10">
        <div className="p-8 flex items-center justify-between border-b border-muted">
          <h2 className="text-xl font-bold text-slate-900">Active Deals</h2>
          <span className="bg-accent text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
            {deals.length}
          </span>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {deals.length === 0 ? (
            <div className="text-center py-12 text-sp-muted">
              <MessageSquare className="w-10 h-10 mx-auto mb-2 text-sp-border" />
              <p className="text-sm">No active negotiations</p>
            </div>
          ) : deals.map(deal => (
            <motion.div
              key={deal._id}
              whileHover={{ x: 4 }}
              onClick={() => setActiveDeal(deal)}
              className={`p-4 rounded-2xl cursor-pointer transition-all border ${
                activeDeal?._id === deal._id
                  ? 'bg-white border-sp-purple/30 shadow-card'
                  : 'border-transparent hover:bg-white hover:border-sp-border'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                   <div className="w-6 h-6 rounded-full bg-sp-purple-pale flex items-center justify-center text-[10px] font-black text-sp-purple">
                     {deal.buyer?.company?.[0] || deal.buyer?.name?.[0] || 'B'}
                   </div>
                   <span className="text-[10px] font-bold text-slate-800 truncate max-w-[100px]">
                     {deal.buyer?.company || deal.buyer?.name || 'Buyer'}
                   </span>
                </div>
                <span className="text-[10px] text-sp-muted font-medium">{deal.time}</span>
              </div>
              
              <div className="flex gap-2 items-center mb-2">
                <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex-shrink-0 overflow-hidden">
                   {deal.product?.image ? (
                     <img src={deal.product.image} className="w-full h-full object-cover" />
                   ) : (
                     <FileText className="w-4 h-4 m-auto mt-2 text-slate-300" />
                   )}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-[11px] text-slate-800 truncate leading-tight">{deal.title}</h3>
                  <p className="text-[9px] text-sp-muted truncate">Round {deal.round || 1}/5</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-black text-xs text-sp-purple">{deal.price}</span>
                <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter ${STATUS_COLORS[deal.status] || 'bg-slate-100 text-slate-600'}`}>
                  {deal.status}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      {activeDeal ? (
        <div className="flex-1 flex flex-col bg-muted/30 relative">
          {/* Chat Header */}
          <div className="h-20 px-8 flex items-center justify-between border-b border-muted bg-white/50 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-sp-purple-pale flex items-center justify-center text-sp-purple font-bold text-sm">
                {activeDeal.buyer?.name?.[0]?.toUpperCase() || activeDeal.buyer?.company?.[0]?.toUpperCase() || '?'}
              </div>
              <div>
                <h2 className="font-black text-slate-900 tracking-tight">{activeDeal.title}</h2>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-sp-success rounded-full" />
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">
                    {activeDeal.buyer?.company ? <b>{activeDeal.buyer.company}</b> : activeDeal.buyer?.name || 'Buyer'} 
                    <span className="mx-1 text-slate-300">•</span>
                    Round {activeDeal.round || 1}/{activeDeal.maxRounds || 5}
                    <span className="mx-1 text-slate-300">•</span>
                    {(activeDeal.buyer as any)?.location || 'India'}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {activeDeal.status === 'New Offer' || activeDeal.status === 'Negotiating' ? (
                <>
                  <button
                    onClick={() => handleDealAction('Accepted')}
                    disabled={updating}
                    className="flex items-center gap-1.5 px-4 py-2 bg-sp-mint text-sp-success rounded-xl text-xs font-bold hover:opacity-90 transition-all disabled:opacity-50"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Accept
                  </button>
                  <button
                    onClick={() => handleDealAction('Rejected')}
                    disabled={updating}
                    className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:opacity-90 transition-all disabled:opacity-50"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                </>
              ) : (
                <span className={`px-3 py-1.5 rounded-xl text-xs font-bold ${STATUS_COLORS[activeDeal.status] || ''}`}>
                  {activeDeal.status}
                </span>
              )}
              <button 
                className={`p-2 rounded-full transition-colors relative ${showHistory ? 'bg-sp-purple-pale text-sp-purple' : 'hover:bg-muted text-slate-600'}`} 
                onClick={() => setShowHistory(!showHistory)}
                title="Negotiation History"
              >
                <History className="w-5 h-5" />
              </button>
              <button 
                className={`p-2 rounded-full transition-colors relative ${showQuickReplies ? 'bg-sp-purple-pale text-sp-purple' : 'hover:bg-muted text-slate-600'}`} 
                onClick={() => setShowQuickReplies(!showQuickReplies)}
                title="Quick Replies"
              >
                <MessageSquare className="w-5 h-5" />
                {showQuickReplies && <div className="absolute top-0 right-0 w-2 h-2 bg-sp-purple rounded-full animate-pulse" />}
              </button>
              <button className="p-2 hover:bg-muted rounded-full transition-colors">
                <Phone className="w-5 h-5 text-slate-600" />
              </button>
              <button className="p-2 hover:bg-muted rounded-full transition-colors">
                <MoreVertical className="w-5 h-5 text-slate-600" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-8 space-y-6 relative">
            <AnimatePresence>
              {messages.map(msg => (
                <motion.div
                  key={msg._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex flex-col ${msg.senderRole === 'manufacturer' ? 'items-end' : 'items-start'}`}
                >
                  <div className={`max-w-md p-5 rounded-3xl text-sm leading-relaxed ${
                    msg.senderRole === 'manufacturer'
                      ? 'bg-accent text-white rounded-tr-none'
                      : 'bg-white text-slate-700 shadow-sm rounded-tl-none border border-muted'
                  }`}>
                    {msg.content}
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1.5">
                    {msg.sender?.name} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Quick Replies Panel */}
            <AnimatePresence>
              {showQuickReplies && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, x: 20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95, x: 20 }}
                  className="absolute right-8 top-8 w-72 bg-white/95 backdrop-blur-md rounded-[2rem] shadow-2xl border border-sp-purple/20 overflow-hidden z-20"
                >
                  <div className="p-5 bg-sp-purple text-white flex justify-between items-center">
                    <span className="text-xs font-bold uppercase tracking-widest">Quick Replies</span>
                    <button onClick={() => setShowQuickReplies(false)} className="hover:rotate-90 transition-transform"><XCircle size={18} /></button>
                  </div>
                  <div className="p-3 max-h-[400px] overflow-y-auto space-y-2">
                    {quickReplies.length === 0 ? (
                      <div className="text-center py-8 text-sp-muted text-xs">No templates found</div>
                    ) : quickReplies.map(reply => (
                      <button
                        key={reply._id}
                        onClick={() => useTemplate(reply.message)}
                        className="w-full text-left p-4 rounded-2xl hover:bg-sp-purple-pale transition-all border border-transparent hover:border-sp-purple/20 group"
                      >
                        <p className="text-[10px] font-bold text-sp-purple uppercase mb-1 tracking-wider">{reply.title}</p>
                        <p className="text-xs text-slate-600 line-clamp-2 group-hover:line-clamp-none leading-relaxed">{reply.message}</p>
                      </button>
                    ))}
                    <button className="w-full mt-4 py-4 border-2 border-dashed border-muted rounded-2xl text-xs text-sp-muted hover:border-sp-purple/50 hover:text-sp-purple hover:bg-sp-purple-pale/30 transition-all flex items-center justify-center gap-2 font-bold">
                      <Plus size={16} /> New Template
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Deal Summary Card */}
            {activeDeal.priceRaw > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md mx-auto bg-white rounded-[2.5rem] p-8 shadow-xl border border-muted"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-bold text-slate-900">Deal Proposal</h3>
                  <FileText className="w-6 h-6 text-sp-muted" />
                </div>
                <div className="bg-muted/50 rounded-3xl p-5 mb-6">
                  <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-1">Offered Price</p>
                  <span className="text-3xl font-bold text-slate-900">₹{activeDeal.priceRaw?.toLocaleString()}</span>
                  {activeDeal.quantity && <p className="text-xs text-sp-muted mt-1">Qty: {activeDeal.quantity} units</p>}
                </div>
                {(activeDeal.status === 'New Offer' || activeDeal.status === 'Negotiating') && (
                  <div className="space-y-4">
                    {activeDeal.counterBy === 'manufacturer' && (activeDeal.round || 1) < (activeDeal.maxRounds || 5) && (
                      <div className="flex gap-2">
                        <input 
                          type="number" 
                          id="mfrCounterPrice"
                          placeholder="Counter Price"
                          className="flex-1 h-12 px-4 rounded-xl border border-muted focus:outline-none focus:border-accent text-sm font-bold"
                        />
                        <button
                          onClick={() => {
                            const val = (document.getElementById('mfrCounterPrice') as HTMLInputElement)?.value;
                            if (val) handleDealAction('Negotiating', parseInt(val));
                          }}
                          className="bg-accent text-white px-6 h-12 rounded-xl text-sm font-bold"
                        >
                          Send Counter
                        </button>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => handleDealAction('Accepted')}
                        disabled={updating}
                        className="bg-accent text-white font-bold py-3.5 rounded-2xl hover:opacity-90 transition-opacity disabled:opacity-50 text-sm"
                      >
                        Accept Deal
                      </button>
                      <button
                        onClick={() => handleDealAction('Rejected')}
                        disabled={updating}
                        className="border-2 border-muted text-slate-600 font-bold py-3.5 rounded-2xl hover:bg-muted transition-colors text-sm disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-6 border-t border-muted bg-white/50">
            <div className="bg-white rounded-full p-2 pl-6 shadow-sm border border-muted flex items-center gap-3">
              <button className="text-muted-foreground hover:text-accent transition-colors">
                <Plus className="w-5 h-5" />
              </button>
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Type your message or use templates..."
                className="flex-1 bg-transparent border-none focus:outline-none text-sm"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || sendingMsg}
                className="bg-accent text-white font-bold px-5 py-2.5 rounded-full flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {sendingMsg ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-sp-muted flex-col gap-3">
          <MessageSquare className="w-12 h-12 text-sp-border" />
          <p className="font-medium">Select a deal to start negotiating</p>
        </div>
      )}

      {/* Right Panel — Deal Info */}
      {activeDeal && (
        <div className="w-80 border-l border-muted bg-white flex flex-col p-6 space-y-6 overflow-y-auto">
          {showHistory ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <History size={16} /> Price History
                </h3>
                <button onClick={() => setShowHistory(false)} className="text-slate-400">✕</button>
              </div>
              <div className="relative pl-4 space-y-6">
                 <div className="absolute left-[7px] top-2 bottom-2 w-px bg-slate-100" />
                 {(activeDeal.negotiationHistory || []).map((h: any, idx: number) => (
                    <div key={idx} className="relative pl-6">
                      <div className={`absolute left-[-13px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white ${h.offeredBy === 'manufacturer' ? 'bg-accent' : 'bg-slate-400'}`} />
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="text-[10px] font-bold text-slate-800 uppercase">Round {h.round}</span>
                        <span className="text-[9px] text-slate-400">{new Date(h.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="bg-muted/30 rounded-xl p-3 border border-muted/20">
                        <p className="text-sm font-bold text-slate-800">₹{h.price?.toLocaleString()}</p>
                        <p className="text-[10px] text-slate-500 mt-1">by {h.offeredBy}</p>
                      </div>
                    </div>
                 ))}
              </div>
            </div>
          ) : (
            <>
              <h3 className="font-bold text-slate-800">Deal Overview</h3>
              <div className="space-y-3">
                {[
                  { label: 'Status', value: activeDeal.status },
                  { label: 'Offered Price', value: activeDeal.price || '—' },
                  { label: 'Qty', value: activeDeal.quantity ? `${activeDeal.quantity} units` : '—' },
                  { label: 'Round', value: `${activeDeal.round || 1} / ${activeDeal.maxRounds || 5}` },
                  { label: 'Expires', value: activeDeal.expiresAt ? new Date(activeDeal.expiresAt).toLocaleString() : '—' },
                ].map(row => (
                  <div key={row.label} className="flex justify-between py-2 border-b border-sp-border last:border-0">
                    <span className="text-xs text-sp-muted">{row.label}</span>
                    <span className="text-xs font-bold text-sp-text">{row.value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-auto">
                <p className="text-[10px] text-sp-muted uppercase tracking-wider mb-2">Buyer</p>
                <div className="flex items-center gap-3 bg-sp-bg rounded-xl p-3">
                  <div className="w-8 h-8 rounded-full bg-sp-purple-pale flex items-center justify-center text-sp-purple font-bold text-xs">
                    {activeDeal.buyer?.name?.[0] || '?'}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-sp-text">{activeDeal.buyer?.name || 'Unknown'}</p>
                    <p className="text-[10px] text-sp-muted">{activeDeal.buyer?.company || ''}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
