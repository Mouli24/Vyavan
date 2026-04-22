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
    <div className="w-80 flex flex-col gap-5 flex-shrink-0">
      <div className="flex gap-2">
        {(['all','open','escalated'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-4 py-2 rounded-xl text-xs font-semibold transition-all"
            style={{
              background: filter === f ? '#5D4037' : 'rgba(93,64,55,0.08)',
              color: filter === f ? '#fff' : '#6B4E3D',
            }}>
            {f === 'all' ? 'All' : f === 'open' ? 'Open' : 'Escalated'}
          </button>
        ))}
      </div>

      <div className="space-y-3 overflow-y-auto">
        {visible.map(item => (
          <motion.div key={item._id}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.01 }}
            onClick={() => onSelect?.(item)}
            className="p-5 rounded-2xl border-2 transition-all cursor-pointer"
            style={{
              background: selected === item._id ? '#FDFBF9' : 'rgba(255,255,255,0.7)',
              borderColor: selected === item._id ? '#6B4E3D' : 'transparent',
              boxShadow: selected === item._id ? '0 2px 12px rgba(107,78,61,0.1)' : 'none',
            }}>
            <div className="flex justify-between items-start mb-3">
              <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: '#A89F91' }}>
                #{item.complaintId}
              </span>
              <span className="text-[9px] font-bold px-2 py-1 rounded-lg tracking-wider"
                style={{
                  background: item.status === 'ESCALATED' ? '#FEF3C7' : item.status === 'ADMIN REVIEWED' ? '#FCE7D6' : '#F5F2ED',
                  color: item.status === 'ESCALATED' ? '#B45309' : item.status === 'ADMIN REVIEWED' ? '#6B4E3D' : '#A89F91',
                }}>
                {item.status}
              </span>
            </div>
            <h3 className="font-bold text-sm mb-3 leading-tight" style={{ color: '#1A1A1A' }}>{item.title}</h3>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2" style={{ color: '#A89F91' }}>
                <Building2 size={13} />
                <span className="text-[11px] font-medium">{item.company}</span>
              </div>
              <div className="flex items-center gap-2" style={{ color: '#A89F91' }}>
                <Layers size={13} />
                <span className="text-[11px] font-medium">{item.category}</span>
              </div>
            </div>
          </motion.div>
        ))}
        {visible.length === 0 && (
          <p className="text-xs text-center py-8" style={{ color: '#A89F91' }}>No complaints found.</p>
        )}
      </div>
    </div>
  );
}
