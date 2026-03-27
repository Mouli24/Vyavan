import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Phone, MoreVertical, Plus, Send, FileText, Loader2, 
  CheckCircle, XCircle, MessageSquare, History, 
  ChevronRight, ArrowLeft, Package, Clock, ShieldCheck, Handshake
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api, Deal, Message, User } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

const STATUS_COLORS: Record<string, string> = {
  Negotiating: 'bg-amber-100 text-amber-700',
  Waiting: 'bg-slate-100 text-slate-600',
  'New Offer': 'bg-sp-purple-pale text-sp-purple',
  Accepted: 'bg-sp-mint text-sp-success',
  Rejected: 'bg-red-50 text-red-600',
  Expired: 'bg-slate-100 text-slate-400',
  'Converted to Order': 'bg-green-100 text-green-700',
};

export default function BuyerNegotiation() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialMfrId = searchParams.get('manufacturer');
  const initialProductId = searchParams.get('product');

  const [deals, setDeals] = useState<Deal[]>([]);
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMsg, setSendingMsg] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [newDealContext, setNewDealContext] = useState<any>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchDeals();
    if (initialProductId) {
       api.getProducts().then(prods => {
         const p = prods.find(x => x._id === initialProductId);
         if (p) setNewDealContext(p);
       });
    }
  }, [initialProductId]);

  const fetchDeals = async () => {
    try {
      const data = await api.getBuyerDeals();
      const list = Array.isArray(data) ? data : [];
      setDeals(list);
      
      const found = list.find(d => 
        (initialProductId && (d.product as any)?._id === initialProductId) ||
        (initialMfrId && (d.manufacturer as any)?._id === initialMfrId)
      );
      
      if (found) {
        setActiveDeal(found);
        setNewDealContext(null);
      } else if (list.length > 0 && !initialProductId) {
        setActiveDeal(list[0]);
      }
    } catch (err) {
      console.error(err);
      setDeals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!activeDeal?._id) return;
    api.getMessages(activeDeal._id)
      .then(setMessages)
      .catch(console.error);
    
    // Auto-scroll
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, [activeDeal?._id]);

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
      alert(typeof e === 'string' ? e : (e as any).message || 'Action failed');
    } finally {
      setUpdating(false);
    }
  };

  const handleConvertToOrder = async () => {
    if (!activeDeal) return;
    setUpdating(true);
    try {
      // For now using user's default address or asking for one
      const res = await api.convertDealToOrder(activeDeal._id, {
        fullName: user?.name || '',
        phone: '—', // In a real app we'd prompt for this
        addressLine1: user?.location || 'Main Street',
        city: 'City',
        state: 'State',
        pincode: '000000',
      });
      alert('Success! Negotiation converted to order.');
      navigate('/buyer/orders');
    } catch (e) {
      alert((e as any).message || 'Conversion failed');
    } finally {
      setUpdating(false);
    }
  };

  const handleInitiateDeal = async (requestedPrice: number, quantity: number, message: string) => {
    if (!newDealContext) return;
    setUpdating(true);
    try {
      const deal = await api.createDeal({
        manufacturer: (newDealContext.manufacturer as any)._id || newDealContext.manufacturer,
        product: newDealContext._id,
        quantity,
        requestedPrice,
        title: `Negotiation for ${newDealContext.name}`,
        subtitle: `Initial offer for ${quantity} units`,
        message
      });
      setDeals(prev => [deal, ...prev]);
      setActiveDeal(deal);
      setNewDealContext(null);
    } catch (e) {
      alert((e as any).message || 'Failed to start negotiation');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-sp-bg">
        <Loader2 className="w-8 h-8 text-sp-purple animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden bg-sp-bg">
      {/* Sidebar: Dealing List */}
      <aside className="w-80 border-r border-sp-border flex flex-col bg-white">
        <div className="p-6 border-b border-sp-border flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Negotiations</h2>
          <span className="bg-sp-purple-pale text-sp-purple text-[10px] font-black px-2 py-0.5 rounded-full">
            {deals.length}
          </span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {deals.length === 0 ? (
            <div className="text-center py-12 text-sp-muted">
              <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-20" />
              <p className="text-xs font-bold">No deals yet</p>
              <button onClick={() => navigate('/buyer/browse')} className="text-xs text-sp-purple mt-2 underline">Browse products</button>
            </div>
          ) : deals.map(deal => (
            <motion.div
              key={deal._id}
              onClick={() => setActiveDeal(deal)}
              className={`p-4 rounded-2xl cursor-pointer transition-all border ${
                activeDeal?._id === deal._id
                  ? 'bg-sp-purple-pale border-sp-purple/20'
                  : 'border-transparent hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0">
                   {(deal.product as any)?.image ? (
                     <img src={(deal.product as any).image} className="w-full h-full object-cover" />
                   ) : (
                     <Package className="w-5 h-5 m-auto mt-2 text-slate-300" />
                   )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-sm text-slate-800 truncate">{deal.title}</h3>
                  <p className="text-[10px] text-sp-muted truncate">{(deal.manufacturer as any)?.company || 'Supplier'}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-black text-sm text-sp-purple">{deal.price}</span>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${STATUS_COLORS[deal.status] || ''}`}>
                  {deal.status}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </aside>

      {/* Main Chat Area */}
      {newDealContext ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-sp-bg">
           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg w-full bg-white rounded-[2.5rem] shadow-2xl border border-sp-border p-10 text-center">
              <div className="w-24 h-24 bg-sp-purple-pale rounded-3xl mx-auto mb-6 flex items-center justify-center text-sp-purple shadow-inner">
                 <Handshake size={48} />
              </div>
              <h2 className="text-2xl font-black text-slate-800 mb-2">Start New Negotiation</h2>
              <p className="text-sm text-slate-500 mb-8 font-medium">You are initiating a negotiation with <b>{(newDealContext.manufacturer as any).company || 'the supplier'}</b> for <b>{newDealContext.name}</b>.</p>
              
              <div className="space-y-4 text-left mb-8">
                 <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest pl-1">Target Quantity</label>
                    <input 
                      type="number" 
                      id="initQty"
                      defaultValue={newDealContext.moq || 100}
                      className="w-full h-14 px-6 rounded-2xl border border-slate-100 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sp-purple/20 font-bold"
                    />
                 </div>
                 <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest pl-1">Target Price (Per Unit)</label>
                    <div className="relative">
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 font-bold text-slate-400">₹</span>
                      <input 
                        type="number"
                        id="initPrice"
                        defaultValue={newDealContext.price}
                        className="w-full h-14 pl-10 pr-6 rounded-2xl border border-slate-100 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sp-purple/20 font-bold"
                      />
                    </div>
                 </div>
                 <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest pl-1">Optional Message</label>
                    <textarea 
                      id="initMsg"
                      placeholder="Add any specific requirements or context..."
                      className="w-full h-24 px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sp-purple/20 font-medium text-sm"
                    />
                 </div>
              </div>

              <div className="flex gap-3">
                 <button onClick={() => { setNewDealContext(null); if (deals.length > 0) setActiveDeal(deals[0]); }} className="flex-1 h-14 rounded-2xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-all">Cancel</button>
                 <button 
                   onClick={() => {
                     const qty = (document.getElementById('initQty') as HTMLInputElement).value;
                     const prc = (document.getElementById('initPrice') as HTMLInputElement).value;
                     const msg = (document.getElementById('initMsg') as HTMLTextAreaElement).value;
                     handleInitiateDeal(parseInt(prc), parseInt(qty), msg);
                   }}
                   disabled={updating}
                   className="flex-1 h-14 rounded-2xl bg-sp-purple text-white font-black uppercase tracking-widest hover:bg-sp-purple-dark transition-all shadow-lg shadow-sp-purple/20 flex items-center justify-center"
                 >
                   {updating ? <Loader2 className="animate-spin" /> : 'Request Quote'}
                 </button>
              </div>
           </motion.div>
        </div>
      ) : activeDeal ? (
        <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC]">
          {/* Header */}
          <div className="h-20 px-8 flex items-center justify-between bg-white border-b border-sp-border">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-sp-border">
                {(activeDeal.manufacturer as any)?.avatar ? (
                  <img src={(activeDeal.manufacturer as any).avatar} className="w-full h-full object-cover" />
                ) : (
                  <span className="font-black text-sp-purple text-xs">{(activeDeal.manufacturer as any)?.company?.[0] || 'S'}</span>
                )}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 leading-none">{(activeDeal.manufacturer as any)?.company || 'Supplier'}</h3>
                <p className="text-[10px] text-sp-muted mt-1 uppercase font-black tracking-widest">
                  Deal Progress • Round {activeDeal.round || 1}/5
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowHistory(!showHistory)}
                className={`p-2.5 rounded-xl transition-all ${showHistory ? 'bg-sp-purple text-white shadow-lg' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                title="Negotiation History"
              >
                <History size={18} />
              </button>
              <button className="p-2.5 bg-slate-50 text-slate-500 rounded-xl hover:bg-slate-100 transition-all">
                <MoreVertical size={18} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-8 space-y-6">
             <div className="flex justify-center mb-8">
               <div className="bg-white border border-sp-border px-4 py-2 rounded-full text-[10px] font-black text-sp-muted uppercase tracking-tighter shadow-sm flex items-center gap-2">
                 <Clock size={12} /> Expiry: {activeDeal.expiresAt ? new Date(activeDeal.expiresAt).toLocaleString() : 'N/A'}
               </div>
             </div>

             {messages.map((msg, i) => (
               <motion.div
                 key={msg._id || i}
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
                 className={`flex ${msg.senderRole === 'buyer' ? 'justify-end' : 'justify-start'}`}
               >
                 <div className={`max-w-[70%] p-4 rounded-3xl ${
                   msg.senderRole === 'buyer' 
                    ? 'bg-sp-purple text-white rounded-br-none shadow-lg shadow-sp-purple/10' 
                    : 'bg-white text-slate-700 border border-sp-border rounded-bl-none shadow-sm'
                 }`}>
                   <p className="text-sm font-medium leading-relaxed">{msg.content}</p>
                   <p className={`text-[9px] mt-2 opacity-60 font-black ${msg.senderRole === 'buyer' ? 'text-white text-right' : 'text-slate-400'}`}>
                     {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                   </p>
                 </div>
               </motion.div>
             ))}
             <div ref={messagesEndRef} />
          </div>

          {/* User Actions Bar */}
          <div className="p-6 bg-white border-t border-sp-border">
             {activeDeal.status === 'Accepted' && (
               <div className="mb-6 p-6 rounded-[2rem] bg-sp-mint/20 border border-sp-mint flex flex-col sm:flex-row items-center justify-between gap-4">
                 <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-2xl bg-sp-mint flex items-center justify-center text-sp-success shadow-lg shadow-sp-success/10">
                     <ShieldCheck size={24} />
                   </div>
                   <div>
                     <p className="font-black text-emerald-900 leading-none mb-1">Price Locked at {activeDeal.price}!</p>
                     <p className="text-xs text-emerald-700 font-medium">
                       {activeDeal.acceptedAt && (
                         <span className="text-sp-purple font-bold">
                           Ends in {Math.max(0, 24 - Math.floor((new Date().getTime() - new Date(activeDeal.acceptedAt).getTime()) / (1000 * 60 * 60)))}h • 
                         </span>
                       )} Please proceed to place the final order.
                     </p>
                   </div>
                 </div>
                 <button 
                   onClick={handleConvertToOrder}
                   disabled={updating}
                   className="w-full sm:w-auto px-8 h-12 rounded-2xl bg-emerald-600 text-white font-black text-sm uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2"
                 >
                   {updating ? <Loader2 size={16} className="animate-spin" /> : <Package size={16} />}
                   Confirm Order
                 </button>
               </div>
             )}

             {['New Offer', 'Negotiating'].includes(activeDeal.status) && (
               <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div className="md:col-span-2 bg-slate-50 border border-slate-100 rounded-[2rem] p-6 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black text-sp-muted uppercase tracking-widest mb-1">Current Offer</p>
                      <h4 className="text-2xl font-black text-slate-800">{activeDeal.price} <span className="text-xs font-normal text-slate-400">per unit</span></h4>
                    </div>
                    {/* Only show counter if round < 5 AND it's buyer turn */}
                    {(activeDeal.round || 1) < (activeDeal.maxRounds || 5) && (activeDeal as any).counterBy === 'buyer' ? (
                      <div className="flex items-center gap-2">
                         <div className="relative">
                           <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                           <input 
                            type="number" 
                            id="counterInput"
                            placeholder="Counter Price"
                            className="h-12 w-40 pl-8 pr-4 rounded-xl border border-slate-200 focus:outline-none focus:border-sp-purple font-bold text-sm"
                           />
                         </div>
                         <button 
                           onClick={() => {
                             const val = (document.getElementById('counterInput') as HTMLInputElement)?.value;
                             if (val) handleDealAction('Negotiating', parseInt(val));
                           }}
                           className="h-12 px-6 rounded-xl bg-sp-purple text-white font-black text-xs uppercase tracking-widest hover:bg-sp-purple-dark transition-all"
                         >
                           Counter
                         </button>
                      </div>
                    ) : (
                      <p className="text-xs font-bold text-slate-400">
                        {(activeDeal as any).counterBy === 'manufacturer' ? 'Waiting for Manufacturer...' : 'Max rounds reached'}
                      </p>
                    )}
                 </div>
                 <div className="flex gap-2">
                    <button 
                      onClick={() => handleDealAction('Accepted')}
                      className="flex-1 h-full rounded-[2rem] bg-emerald-100 text-emerald-700 border border-emerald-200 font-black text-xs uppercase tracking-widest hover:bg-emerald-200 transition-all flex flex-col items-center justify-center gap-1"
                    >
                      <CheckCircle size={18} />
                      Accept
                    </button>
                    <button 
                      onClick={() => handleDealAction('Rejected')}
                      className="flex-1 h-full rounded-[2rem] bg-red-50 text-red-600 border border-red-100 font-black text-xs uppercase tracking-widest hover:bg-red-100 transition-all flex flex-col items-center justify-center gap-1"
                    >
                      <XCircle size={18} />
                      Reject
                    </button>
                 </div>
               </div>
             )}

             {/* Message Input */}
             <div className="bg-slate-50 rounded-full p-2 pl-6 flex items-center gap-3 border border-slate-100 shadow-inner">
               <button className="text-slate-400 hover:text-sp-purple transition-colors">
                 <Plus size={20} />
               </button>
               <input 
                 type="text"
                 value={input}
                 onChange={e => setInput(e.target.value)}
                 onKeyDown={e => e.key === 'Enter' && handleSend()}
                 placeholder="Discuss specific requirements with the supplier..."
                 className="flex-1 bg-transparent border-none focus:outline-none text-sm font-medium text-slate-700 placeholder:text-slate-400"
               />
               <button 
                 onClick={handleSend}
                 disabled={!input.trim() || sendingMsg}
                 className="w-12 h-12 rounded-full bg-sp-purple text-white flex items-center justify-center hover:bg-sp-purple-dark disabled:opacity-40 transition-all shadow-lg shadow-sp-purple/20"
               >
                 {sendingMsg ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
               </button>
             </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <MessageSquare size={64} strokeWidth={1} className="mx-auto mb-4 opacity-10" />
            <h3 className="text-lg font-black text-slate-400 uppercase tracking-widest">Select a Negotiation</h3>
            <p className="text-sm font-medium text-slate-300 mt-2">Choose a supplier thread from the left to start talking</p>
          </motion.div>
        </div>
      )}

      {/* Right Sidebar: Deal Details & History */}
      <AnimatePresence>
        {activeDeal && showHistory && (
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-80 bg-white border-l border-sp-border flex flex-col"
          >
            <div className="p-6 border-b border-sp-border flex items-center justify-between">
              <h3 className="font-black text-slate-900 uppercase tracking-tight text-xs">Negotiation Details</h3>
              <button 
                onClick={() => setShowHistory(false)}
                className="text-slate-400 hover:text-slate-700 hover:rotate-90 transition-all"
              >
                <XCircle size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
               {/* Product Summary */}
               <div className="space-y-4">
                 <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-sp-bg flex items-center justify-center text-sp-purple">
                      <FileText size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-800 leading-none">Deal Package</h4>
                      <p className="text-[10px] text-sp-muted mt-1 uppercase font-black tracking-widest">Specifications</p>
                    </div>
                 </div>
                 <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-[11px] text-slate-500 font-bold uppercase tracking-tighter">Product</span>
                      <span className="text-[11px] text-slate-800 font-black truncate max-w-[120px]">{(activeDeal.product as any)?.name || 'Default Product'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[11px] text-slate-500 font-bold uppercase tracking-tighter">Quantity</span>
                      <span className="text-[11px] text-slate-800 font-black">{activeDeal.quantity || 1} units</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[11px] text-slate-500 font-bold uppercase tracking-tighter">Base Price</span>
                      <span className="text-[11px] text-slate-800 font-black">₹{(activeDeal.product as any)?.price?.toLocaleString() || '0'}</span>
                    </div>
                 </div>
               </div>

               {/* History Timeline */}
               <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                      <History size={20} />
                    </div>
                    <h4 className="font-bold text-sm text-slate-800 leading-none">Price History</h4>
                  </div>
                  
                  <div className="relative pl-6 space-y-6">
                    {/* Vertical line */}
                    <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-slate-100" />
                    
                    {[(activeDeal as any).negotiationHistory || []].flat().length === 0 ? (
                      <div className="text-[10px] text-slate-400 font-bold uppercase italic py-4">No previous rounds</div>
                    ) : (activeDeal as any).negotiationHistory.map((h: any, idx: number) => (
                      <div key={idx} className="relative">
                        <div className={`absolute -left-[1.375rem] top-1 w-3 h-3 rounded-full border-2 border-white shadow-sm ${h.offeredBy === 'buyer' ? 'bg-sp-purple' : 'bg-slate-400'}`} />
                        <div>
                          <div className="flex justify-between items-baseline mb-1">
                            <span className="text-[11px] font-black text-slate-800 uppercase tracking-tighter">Round {h.round}</span>
                            <span className="text-[10px] text-slate-400">{new Date(h.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                          </div>
                          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                            <p className="text-base font-black text-slate-900">₹{h.price?.toLocaleString()}</p>
                            <p className="text-[10px] text-slate-500 mt-1 font-medium leading-tight line-clamp-2">By {h.offeredBy}: {h.message}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
               </div>

               {/* Terms & Expiry */}
               <div className="bg-sp-purple-pale/30 border border-sp-purple/10 rounded-2xl p-4">
                  <p className="text-[10px] font-black text-sp-purple uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Clock size={12} /> Auto-Expiry Information
                  </p>
                  <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                    This deal expires if not responded to within 48 hours. Upon expiry, the latest offer becomes void.
                  </p>
               </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
