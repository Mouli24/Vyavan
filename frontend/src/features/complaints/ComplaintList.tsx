import { useState, useEffect } from 'react';
import { Building2, Layers } from 'lucide-react';
import { motion } from 'motion/react';
import { api, Complaint } from '@/lib/api';

export default function ComplaintList({ onSelect, selected }: { onSelect?: (c: Complaint) => void; selected?: string }) {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [filter, setFilter] = useState<'all' | 'open' | 'escalated'>('all');

  useEffect(() => {
    api.getComplaints().then(setComplaints).catch(console.error);
  }, []);

  const visible = complaints.filter(c => {
    if (filter === 'open') return c.status === 'PENDING';
    if (filter === 'escalated') return c.status === 'ESCALATED';
    return true;
  });

  return (
    <div className="w-80 flex flex-col gap-6 flex-shrink-0">
      <div className="flex gap-2">
        <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-full text-xs font-semibold ${filter === 'all' ? 'bg-brand-brown text-white' : 'bg-gray-200/50 text-gray-600 hover:bg-gray-200'}`}>All Complaints</button>
        <button onClick={() => setFilter('open')} className={`px-4 py-2 rounded-full text-xs font-semibold ${filter === 'open' ? 'bg-brand-brown text-white' : 'bg-gray-200/50 text-gray-600 hover:bg-gray-200'}`}>Open</button>
        <button onClick={() => setFilter('escalated')} className={`px-4 py-2 rounded-full text-xs font-semibold ${filter === 'escalated' ? 'bg-brand-brown text-white' : 'bg-gray-200/50 text-gray-600 hover:bg-gray-200'}`}>Escalated</button>
      </div>

      <div className="space-y-4 overflow-y-auto">
        {visible.map((item) => (
          <motion.div
            key={item._id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            onClick={() => onSelect?.(item)}
            className={`p-5 rounded-3xl border-2 transition-all cursor-pointer relative overflow-hidden ${
              selected === item._id
                ? 'bg-white border-brand-brown shadow-md'
                : 'bg-white/60 border-transparent hover:border-gray-200'
            }`}
          >
            <div className="flex justify-between items-start mb-3">
              <span className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">ORDER #{item.complaintId}</span>
              <span className={`text-[9px] font-bold px-2 py-1 rounded-md tracking-wider ${
                item.status === 'ESCALATED' ? 'bg-orange-500 text-white' :
                item.status === 'ADMIN REVIEWED' ? 'bg-blue-100 text-blue-600' :
                'bg-gray-100 text-gray-500'
              }`}>
                {item.status}
              </span>
            </div>
            <h3 className="font-bold text-sm mb-4 leading-tight">{item.title}</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-gray-500">
                <Building2 size={14} />
                <span className="text-[11px] font-medium">{item.company}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                <Layers size={14} />
                <span className="text-[11px] font-medium">{item.category}</span>
              </div>
            </div>
          </motion.div>
        ))}
        {visible.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-8">No complaints found.</p>
        )}
      </div>
    </div>
  );
}
