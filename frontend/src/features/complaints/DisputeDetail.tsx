import { useState } from 'react';
import { MoreVertical, Mail, RefreshCw, DollarSign, Ban, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { api, Complaint } from '@/lib/api';

interface Props {
  complaint?: Complaint;
  onResolved?: (updated: Complaint) => void;
}

export default function DisputeDetail({ complaint, onResolved }: Props) {
  const [response, setResponse] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handle = async (resolution: 'replace' | 'refund' | 'rejected') => {
    if (!complaint) return;
    setSubmitting(true);
    try {
      const statusMap = { replace: 'RESOLVED', refund: 'RESOLVED', rejected: 'REJECTED' } as const;
      const updated = await api.respondComplaint(complaint._id, {
        response,
        resolution: { type: resolution },
        status: statusMap[resolution],
      });
      setResponse('');
      onResolved?.(updated);
    } catch (err: any) {
      console.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!complaint) {
    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
        className="flex-1 rounded-2xl p-10 flex flex-col items-center justify-center border"
        style={{ background: '#FDFBF9', borderColor: '#E5E1DA' }}>
        <p className="text-sm font-medium" style={{ color: '#A89F91' }}>Select a complaint to view details</p>
      </motion.div>
    );
  }

  return (
    <motion.div key={complaint._id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
      className="flex-1 rounded-2xl p-8 flex flex-col relative overflow-hidden border"
      style={{ background: '#FDFBF9', borderColor: '#E5E1DA' }}>

      <div className="flex justify-between items-start mb-7">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: '#A89F91' }}>ACTIVE DISPUTE CASE</span>
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          </div>
          <h2 className="text-2xl font-bold leading-tight max-w-2xl" style={{ color: '#1A1A1A' }}>
            {complaint.title}
          </h2>
        </div>
        <button className="p-2 rounded-xl transition-colors hover:bg-mfr-peach" style={{ color: '#A89F91' }}>
          <MoreVertical size={18} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <p className="text-[10px] font-bold tracking-widest uppercase mb-2" style={{ color: '#A89F91' }}>CLIENT ORGANIZATION</p>
          <p className="font-bold text-base" style={{ color: '#1A1A1A' }}>{complaint.company}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold tracking-widest uppercase mb-2" style={{ color: '#A89F91' }}>FILING DATE</p>
          <p className="font-bold text-base" style={{ color: '#1A1A1A' }}>{complaint.filingDate ?? '—'}</p>
        </div>
      </div>

      <div className="space-y-3 mb-8">
        <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: '#A89F91' }}>ISSUE DESCRIPTION</p>
        <div className="p-6 rounded-2xl border" style={{ background: '#F5F2ED', borderColor: '#E5E1DA' }}>
          <p className="leading-relaxed text-sm italic" style={{ color: '#6B4E3D' }}>
            "{complaint.description ?? 'No description provided.'}"
          </p>
        </div>
      </div>

      {complaint.evidence && complaint.evidence.length > 0 && (
        <div className="space-y-3 mb-8">
          <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: '#A89F91' }}>EVIDENCE ARTIFACTS</p>
          <div className="flex gap-3">
            {complaint.evidence.map((url, i) => (
              <div key={i} className="w-20 h-20 rounded-xl overflow-hidden border-2 border-white shadow-md">
                <img src={url} alt={`Evidence ${i + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
            ))}
            <button className="w-20 h-20 rounded-xl border-2 border-dashed flex items-center justify-center transition-all"
              style={{ borderColor: '#E5E1DA', color: '#A89F91' }}>
              <Plus size={20} />
            </button>
          </div>
        </div>
      )}

      <div className="mt-auto space-y-5">
        <div className="relative">
          <p className="text-[10px] font-bold tracking-widest uppercase mb-3" style={{ color: '#A89F91' }}>DRAFT OFFICIAL RESPONSE</p>
          <textarea
            value={response}
            onChange={e => setResponse(e.target.value)}
            placeholder="Provide your technical assessment and resolution terms..."
            className="w-full rounded-2xl p-5 text-sm outline-none min-h-[100px] resize-none border transition-all"
            style={{ background: '#F5F2ED', borderColor: '#E5E1DA', color: '#1A1A1A' }}
            onFocus={e => (e.currentTarget.style.borderColor = '#6B4E3D')}
            onBlur={e => (e.currentTarget.style.borderColor = '#E5E1DA')}
          />
          <button className="absolute right-4 bottom-4 w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md transition-all hover:opacity-90"
            style={{ background: '#5D4037' }}>
            <Mail size={17} />
          </button>
        </div>

        <div className="flex gap-3">
          <button onClick={() => handle('replace')} disabled={submitting}
            className="flex-1 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 text-white transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: '#5D4037' }}>
            <RefreshCw size={16} /> Replace Batch
          </button>
          <button onClick={() => handle('refund')} disabled={submitting}
            className="flex-1 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: '#FCE7D6', color: '#5D4037' }}>
            <DollarSign size={16} /> Full Refund
          </button>
          <button onClick={() => handle('rejected')} disabled={submitting}
            className="flex-1 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: '#F5F2ED', color: '#A89F91', border: '1px solid #E5E1DA' }}>
            <Ban size={16} /> Reject Claim
          </button>
        </div>
      </div>
    </motion.div>
  );
}
