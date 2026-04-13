import { Phone, MoreVertical, Plus, Send, FileText } from 'lucide-react';
import { MESSAGES } from './constants';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

export function ChatArea() {
  return (
    <div className="flex-1 flex flex-col bg-muted/30">
      {/* Chat Header */}
      <div className="h-20 px-8 flex items-center justify-between border-b border-muted bg-white/50 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
            GI
          </div>
          <div>
            <h2 className="font-bold text-slate-900">Global Infrastructure Inc.</h2>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span className="text-[10px] text-muted-foreground">Online | ID: #GI-8821</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-muted rounded-full transition-colors">
            <Phone className="w-5 h-5 text-slate-600" />
          </button>
          <button className="p-2 hover:bg-muted rounded-full transition-colors">
            <MoreVertical className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-8 space-y-8">
        {MESSAGES.map((msg) => (
          <div key={msg.id} className={cn('flex flex-col', msg.sender === 'me' ? 'items-end' : 'items-start')}>
            <div className={cn(
              'max-w-md p-6 rounded-3xl text-sm leading-relaxed',
              msg.sender === 'me'
                ? 'bg-accent text-white rounded-tr-none'
                : 'bg-white text-slate-700 shadow-sm rounded-tl-none border border-muted'
            )}>
              {msg.text}
            </div>
            <span className="text-[10px] text-muted-foreground mt-2">{msg.time}</span>
          </div>
        ))}

        {/* Deal Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto bg-white rounded-[2.5rem] p-8 shadow-xl border border-muted relative overflow-hidden"
        >
          <div className="absolute top-6 right-6 opacity-10">
            <FileText className="w-12 h-12" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Deal Summary Update</h3>
          <p className="text-xs text-muted-foreground mb-8 leading-relaxed">
            The partner has proposed a counter-offer of <span className="font-bold text-slate-900">$40,500</span> with a 15% deposit.
          </p>
          <div className="bg-muted/50 rounded-3xl p-6 mb-8">
            <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-2">Current Proposal</p>
            <div className="flex items-end justify-between">
              <span className="text-3xl font-bold text-slate-900">$40,500.00</span>
              <div className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded-full">
                <span className="text-[10px] font-bold text-green-600">-4.7% change</span>
              </div>
            </div>
          </div>
          <p className="text-center text-xs font-medium text-muted-foreground mb-4">Approved Transaction?</p>
          <div className="grid grid-cols-2 gap-4">
            <button className="bg-accent text-white font-bold py-4 rounded-2xl hover:opacity-90 transition-opacity">
              Accept Offer
            </button>
            <button className="border-2 border-muted text-slate-600 font-bold py-4 rounded-2xl hover:bg-muted transition-colors">
              Reject
            </button>
          </div>
        </motion.div>
      </div>

      {/* Input Area */}
      <div className="p-8">
        <div className="bg-white rounded-full p-2 pl-6 shadow-lg border border-muted flex items-center gap-4">
          <button className="text-muted-foreground hover:text-accent transition-colors">
            <Plus className="w-5 h-5" />
          </button>
          <input
            type="text"
            placeholder="Type your message or counter offer..."
            className="flex-1 bg-transparent border-none focus:outline-none text-sm"
          />
          <button className="bg-highlight text-accent font-bold px-6 py-3 rounded-full flex items-center gap-2 hover:opacity-90 transition-opacity">
            Send <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
