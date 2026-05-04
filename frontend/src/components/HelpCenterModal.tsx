import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, HelpCircle, Book, MessageCircle, Phone, 
  ChevronRight, Mail, ShieldQuestion, Truck, CreditCard, RotateCcw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  role?: 'buyer' | 'manufacturer';
}

const FAQ_ITEMS = [
  { 
    icon: Truck, 
    title: 'Shipping & Delivery', 
    desc: 'Track orders, shipping timelines, and international logistics.',
    q: 'How long does shipping take?',
    a: 'Timelines vary by manufacturer and region, typically 7-15 business days for domestic B2B batches.'
  },
  { 
    icon: CreditCard, 
    title: 'Payments & Escrow', 
    desc: 'Secure payments, milestone releases, and tax invoices.',
    q: 'How does escrow work?',
    a: 'Payments are held securely by Vyawan and only released to the manufacturer after you confirm delivery.'
  },
  { 
    icon: RotateCcw, 
    title: 'Returns & Quality', 
    desc: 'Quality disputes, return requests, and sample verification.',
    q: 'What is the return policy?',
    a: 'You can request a return within 3 days of delivery if the quality does not match the agreed specifications.'
  }
];

export default function HelpCenterModal({ isOpen, onClose, role = 'buyer' }: Props) {
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-brand-charcoal/40 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="bg-[#FAF8F5] p-8 border-b border-[#E5E1DA] flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#5D4037] flex items-center justify-center shadow-lg">
                  <HelpCircle className="text-white" size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Help Center</h2>
                  <p className="text-sm text-slate-500 font-medium">How can we assist your business today?</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white border border-[#E5E1DA] flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all shadow-sm"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 max-h-[70vh] overflow-y-auto">
              {/* Left: Quick Actions */}
              <div className="space-y-6">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#A89F91]">Common Topics</h3>
                <div className="space-y-3">
                  {FAQ_ITEMS.map((item, i) => (
                    <button 
                      key={i}
                      className="w-full p-4 rounded-2xl border border-[#E5E1DA] bg-white hover:border-[#5D4037]/30 hover:bg-[#FAF8F5] transition-all text-left group"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-[#FCE7D6] flex items-center justify-center text-[#5D4037]">
                          <item.icon size={16} />
                        </div>
                        <span className="font-bold text-sm text-slate-900">{item.title}</span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed pr-4">{item.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Right: Contact & Support */}
              <div className="space-y-6">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#A89F91]">Direct Support</h3>
                
                <div className="p-6 rounded-3xl bg-gradient-to-br from-[#5D4037] to-[#3E2723] text-white shadow-xl">
                  <h4 className="text-lg font-black mb-2">Need immediate help?</h4>
                  <p className="text-xs text-white/70 leading-relaxed mb-6">Our dedicated support team is available 24/7 for enterprise partners.</p>
                  
                  <div className="space-y-3">
                    <button className="w-full flex items-center justify-between p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all">
                      <div className="flex items-center gap-3 text-sm font-bold">
                        <MessageCircle size={16} />
                        Live Chat
                      </div>
                      <ChevronRight size={14} className="opacity-50" />
                    </button>
                    <button className="w-full flex items-center justify-between p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all">
                      <div className="flex items-center gap-3 text-sm font-bold">
                        <Phone size={16} />
                        +91 (800) 123-4567
                      </div>
                      <ChevronRight size={14} className="opacity-50" />
                    </button>
                    <button className="w-full flex items-center justify-between p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all">
                      <div className="flex items-center gap-3 text-sm font-bold">
                        <Mail size={16} />
                        support@vyawan.com
                      </div>
                      <ChevronRight size={14} className="opacity-50" />
                    </button>
                  </div>
                </div>

                <div className="bg-[#F3EEFF] border border-[#EDE9FE] rounded-3xl p-6">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-lg flex-shrink-0">
                      <ShieldQuestion size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-purple-900 text-sm mb-1">Dispute Resolution</h4>
                      <p className="text-[11px] text-purple-700 leading-relaxed mb-4">Having an issue with an active order? File an official dispute for mediation.</p>
                      <button 
                        onClick={() => {
                          onClose();
                          navigate(role === 'buyer' ? '/buyer/orders' : '/manufacturer/complaints');
                        }}
                        className="text-xs font-black uppercase tracking-widest text-purple-600 hover:text-purple-800 transition-colors"
                      >
                        Raise a Dispute &rarr;
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-[#FAF8F5] border-t border-[#E5E1DA] text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#A89F91]">
                Vyawan Enterprise Protection &bull; Reliable B2B Sourcing
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
