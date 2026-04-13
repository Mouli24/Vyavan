import { useState, useEffect } from 'react';
import { ArrowRight, Building2, User, RefreshCcw } from 'lucide-react';
import { motion } from 'motion/react';
import { api, Settlement } from '@/lib/api';

function iconFor(type: string) {
  if (type === 'bank') return Building2;
  if (type === 'refund') return RefreshCcw;
  return User;
}

function colorFor(type: string) {
  if (type === 'bank') return 'text-blue-500 bg-blue-50';
  if (type === 'refund') return 'text-purple-500 bg-purple-50';
  return 'text-orange-500 bg-orange-50';
}

export default function SettlementHistory() {
  const [settlements, setSettlements] = useState<Settlement[]>([]);

  useEffect(() => {
    api.getSettlements().then(setSettlements).catch(console.error);
  }, []);

  return (
    <div className="mt-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h4 className="text-2xl font-bold text-brand-dark">Recent Settlement History</h4>
          <p className="text-sm text-brand-dark/40 font-medium">Your most recent financial transfers and their statuses.</p>
        </div>
        <button className="flex items-center gap-2 text-sm font-bold text-brand-dark hover:gap-3 transition-all">
          View All Activity <ArrowRight size={18} />
        </button>
      </div>
      <div className="space-y-4">
        <div className="grid grid-cols-5 px-8 py-2 text-[10px] font-bold uppercase tracking-widest text-brand-dark/30">
          <span>Date</span>
          <span>Reference ID</span>
          <span>Recipient</span>
          <span>Amount</span>
          <span className="text-right">Status</span>
        </div>
        {settlements.map((item, i) => {
          const Icon = iconFor(item.type);
          const color = colorFor(item.type);
          return (
            <motion.div
              key={item._id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="grid grid-cols-5 items-center px-8 py-5 bg-white rounded-[24px] border border-brand-brown/5 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            >
              <span className="text-sm font-bold text-brand-dark">{item.date}</span>
              <span className="text-sm font-medium text-brand-dark/40 font-mono">{item.referenceId}</span>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${color}`}>
                  <Icon size={14} />
                </div>
                <span className="text-sm font-bold text-brand-dark">{item.recipient}</span>
              </div>
              <span className="text-sm font-bold text-brand-dark">{item.amount}</span>
              <div className="flex justify-end">
                <div className={`px-4 py-1 rounded-full text-[10px] font-bold tracking-wider ${
                  item.status === 'COMPLETED'
                    ? 'bg-green-50 text-green-600 border border-green-100'
                    : 'bg-orange-50 text-orange-600 border border-orange-100'
                }`}>
                  {item.status}
                </div>
              </div>
            </motion.div>
          );
        })}
        {settlements.length === 0 && (
          <p className="text-xs text-brand-dark/30 text-center py-8">No settlements yet.</p>
        )}
      </div>
    </div>
  );
}
