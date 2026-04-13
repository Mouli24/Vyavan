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

  // Placeholder when nothing selected
  if (!complaint) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex-1 bg-white rounded-[40px] shadow-md p-10 flex flex-col items-center justify-center text-gray-400"
      >
        <p className="text-sm font-medium">Select a complaint to view details</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      key={complaint._id}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex-1 bg-white rounded-[40px] shadow-md p-10 flex flex-col relative overflow-hidden"
    >
      <div className="flex justify-between items-start mb-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">ACTIVE DISPUTE CASE</span>
            <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
          </div>
          <h2 className="text-3xl font-bold text-brand-charcoal leading-tight max-w-2xl">
            {complaint.title}
          </h2>
        </div>
        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <MoreVertical size={20} className="text-gray-400" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-12 mb-10">
        <div>
          <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-2">CLIENT ORGANIZATION</p>
          <p className="font-bold text-lg">{complaint.company}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-2">FILING DATE</p>
          <p className="font-bold text-lg">{complaint.filingDate ?? '—'}</p>
        </div>
      </div>

      <div className="space-y-4 mb-10">
        <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">ISSUE DESCRIPTION</p>
        <div className="bg-brand-cream/30 p-8 rounded-[32px] border border-brand-cream/50">
          <p className="text-gray-600 leading-relaxed text-sm italic">
            "{complaint.description ?? 'No description provided.'}"
          </p>
        </div>
      </div>

      {complaint.evidence && complaint.evidence.length > 0 && (
        <div className="space-y-4 mb-10">
          <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">EVIDENCE ARTIFACTS</p>
          <div className="flex gap-4">
            {complaint.evidence.map((url, i) => (
              <div key={i} className="w-24 h-24 rounded-3xl overflow-hidden border-4 border-white shadow-md">
                <img src={url} alt={`Evidence ${i + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
            ))}
            <button className="w-24 h-24 rounded-3xl border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400 hover:border-brand-peach hover:text-brand-peach transition-all">
              <Plus size={24} />
            </button>
          </div>
        </div>
      )}

      <div className="mt-auto space-y-6">
        <div className="relative">
          <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-4">DRAFT OFFICIAL RESPONSE</p>
          <textarea
            value={response}
            onChange={e => setResponse(e.target.value)}
            placeholder="Provide your technical assessment and resolution terms..."
            className="w-full bg-brand-cream/20 border-none rounded-[32px] p-8 text-sm focus:ring-2 focus:ring-brand-peach outline-none min-h-[120px] resize-none"
          />
          <button className="absolute right-6 bottom-6 w-12 h-12 bg-brand-brown rounded-2xl flex items-center justify-center text-white shadow-lg hover:scale-110 transition-transform">
            <Mail size={20} />
          </button>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => handle('replace')}
            disabled={submitting}
            className="flex-1 bg-brand-brown text-white py-4 rounded-full font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <RefreshCw size={18} /> Replace Batch
          </button>
          <button
            onClick={() => handle('refund')}
            disabled={submitting}
            className="flex-1 bg-brand-blue text-brand-charcoal py-4 rounded-full font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <DollarSign size={18} /> Full Refund
          </button>
          <button
            onClick={() => handle('rejected')}
            disabled={submitting}
            className="flex-1 bg-brand-purple text-brand-charcoal py-4 rounded-full font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Ban size={18} /> Reject Claim
          </button>
        </div>
      </div>
    </motion.div>
  );
}
