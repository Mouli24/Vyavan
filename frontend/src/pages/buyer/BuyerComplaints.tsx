import { useState, useEffect } from 'react';
import { 
  AlertCircle, 
  Plus, 
  Search, 
  MessageSquare, 
  Clock, 
  ShieldCheck, 
  ShieldAlert, 
  ChevronRight, 
  X, 
  Image as ImageIcon,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api, Complaint } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';

export default function BuyerComplaints() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newComplaint, setNewComplaint] = useState({
    title: '',
    category: 'Product Quality',
    description: '',
    manufacturer: '', // ID
    company: user?.company || '',
    evidence: [] as string[]
  });

  useEffect(() => {
    api.getMyComplaints()
      .then(setComplaints)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async () => {
    if (!newComplaint.title || !newComplaint.description || !newComplaint.manufacturer) {
      alert('Please fill in all required fields');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.fileComplaint(newComplaint);
      setComplaints([res, ...complaints]);
      setShowNewModal(false);
      setNewComplaint({ ...newComplaint, title: '', description: '', manufacturer: '' });
    } catch (err) {
      console.error(err);
      alert('Failed to submit complaint');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEscalate = async (id: string) => {
    if (!confirm('Are you sure you want to escalate this to Vyawan Admin?')) return;
    try {
      const res = await api.escalateComplaint(id);
      setComplaints(prev => prev.map(c => c._id === id ? { ...c, status: res.status } : c));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 text-sp-purple animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-sp-text tracking-tight">Support <span className="text-sp-purple">&amp; Complaints</span></h1>
          <p className="text-sp-muted font-bold uppercase text-[10px] tracking-widest mt-1">Resolution center for buyers</p>
        </div>
        <Button 
          onClick={() => setShowNewModal(true)}
          className="gradient-card-purple text-white rounded-2xl px-6 h-12 font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-sp-purple/20 hover:scale-105 active:scale-95 transition-all"
        >
          <Plus size={18} /> New Ticket
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {[
          { label: 'Total Tickets', value: complaints.length, icon: MessageSquare, color: 'bg-sp-bg text-sp-text' },
          { label: 'Resolved', value: complaints.filter(c => c.status === 'RESOLVED').length, icon: ShieldCheck, color: 'bg-sp-mint text-sp-success' },
          { label: 'Escalated', value: complaints.filter(c => c.status === 'ESCALATED').length, icon: ShieldAlert, color: 'bg-red-50 text-red-600' },
        ].map(stat => (
          <div key={stat.label} className={`${stat.color} p-6 rounded-[2rem] border border-sp-border shadow-sm`}>
            <stat.icon className="w-6 h-6 mb-4 opacity-70" />
            <p className="text-3xl font-black tracking-tight">{stat.value}</p>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {complaints.length === 0 ? (
          <div className="bg-sp-bg rounded-[2.5rem] py-20 text-center border-2 border-dashed border-sp-border">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-sp-border" />
            <p className="font-black text-sp-text">No active tickets</p>
            <p className="text-xs text-sp-muted mt-1 uppercase font-bold tracking-widest">Great! You have no pending disputes or issues at the moment.</p>
          </div>
        ) : (
          complaints.map((ticket, idx) => (
            <motion.div
              key={ticket._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white rounded-[2.5rem] p-8 border border-sp-border shadow-sm hover:border-sp-purple/30 transition-all flex flex-col md:flex-row gap-8 items-start group"
            >
              <div className="w-16 h-16 bg-sp-bg rounded-[1.5rem] flex items-center justify-center shrink-0">
                {ticket.status === 'RESOLVED' ? <ShieldCheck className="text-sp-success" /> : <Clock className="text-sp-muted" />}
              </div>

              <div className="flex-1 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-black text-sp-text">{ticket.title}</h3>
                    <p className="text-[10px] font-black text-sp-muted uppercase tracking-widest mt-1">ID: {ticket.complaintId} • Category: {ticket.category}</p>
                  </div>
                  <Badge className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest border-none ${
                    ticket.status === 'RESOLVED' ? 'bg-sp-mint text-sp-success' :
                    ticket.status === 'ESCALATED' ? 'bg-red-50 text-red-600' :
                    'bg-sp-purple-pale text-sp-purple'
                  }`}>
                    {ticket.status}
                  </Badge>
                </div>

                <p className="text-sm text-sp-muted leading-relaxed line-clamp-2">
                  {ticket.description}
                </p>

                {ticket.response && (
                  <div className="bg-sp-bg/50 p-5 rounded-[1.5rem] border border-sp-border/50">
                    <p className="text-[10px] font-black text-sp-purple uppercase tracking-widest mb-1">Manufacturer Response</p>
                    <p className="text-xs font-medium text-sp-text italic">"{ticket.response}"</p>
                  </div>
                )}
              </div>

              <div className="shrink-0 flex flex-col gap-3 h-full md:items-end">
                <p className="text-[10px] font-black text-sp-muted uppercase tracking-widest">{ticket.filingDate}</p>
                <div className="flex gap-2 mt-auto">
                  {ticket.status !== 'ESCALATED' && ticket.status !== 'RESOLVED' && (
                    <Button 
                      variant="outline" 
                      onClick={() => handleEscalate(ticket._id)}
                      className="rounded-xl border-sp-border text-[9px] font-black uppercase tracking-widest px-4 h-9 hover:border-red-500 hover:text-red-500"
                    >
                      Escalate
                    </Button>
                  )}
                  <Button className="rounded-xl bg-sp-bg text-sp-muted px-4 h-9 hover:bg-sp-purple hover:text-white group-hover:bg-sp-purple group-hover:text-white transition-all">
                    <ChevronRight size={16} />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* New Complaint Modal */}
      <AnimatePresence>
        {showNewModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowNewModal(false)}
              className="absolute inset-0 bg-sp-text/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-xl rounded-[2.5rem] p-10 shadow-2xl relative z-10"
            >
              <button 
                onClick={() => setShowNewModal(false)}
                className="absolute top-8 right-8 text-sp-muted hover:text-sp-text p-2 hover:bg-sp-bg rounded-full transition-all"
              >
                <X size={20} />
              </button>

              <h2 className="text-2xl font-black text-sp-text mb-2">File a <span className="text-sp-purple">Complaint</span></h2>
              <p className="text-xs font-bold text-sp-muted uppercase tracking-widest mb-8">Our team will assist in resolving any dispute.</p>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-sp-muted uppercase tracking-widest mb-2 block">Case Title</label>
                  <Input 
                    value={newComplaint.title}
                    onChange={e => setNewComplaint({...newComplaint, title: e.target.value})}
                    placeholder="e.g. Delayed shipment or Material mismatch" 
                    className="rounded-2xl h-14 border-sp-border bg-sp-bg/30 font-bold focus:bg-white" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-sp-muted uppercase tracking-widest mb-2 block">Resolution Level</label>
                    <select 
                      value={newComplaint.category}
                      onChange={e => setNewComplaint({...newComplaint, category: e.target.value})}
                      className="w-full rounded-2xl h-14 border-sp-border bg-sp-bg/30 px-4 text-sm font-bold focus:border-sp-purple outline-none"
                    >
                      <option>Product Quality</option>
                      <option>Shipping Delay</option>
                      <option>Billing Issue</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-sp-muted uppercase tracking-widest mb-2 block">Manufacturer ID</label>
                    <Input 
                      value={newComplaint.manufacturer}
                      onChange={e => setNewComplaint({...newComplaint, manufacturer: e.target.value})}
                      placeholder="MFR-XXX" 
                      className="rounded-2xl h-14 border-sp-border bg-sp-bg/30 font-bold focus:bg-white" 
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-sp-muted uppercase tracking-widest mb-2 block">Detailed Description</label>
                  <textarea 
                    value={newComplaint.description}
                    onChange={e => setNewComplaint({...newComplaint, description: e.target.value})}
                    placeholder="Explain the issue in detail..."
                    className="w-full rounded-[2rem] p-6 border border-sp-border bg-sp-bg/30 h-32 text-sm font-bold focus:bg-white focus:border-sp-purple outline-none resize-none transition-all"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <Button variant="outline" className="flex-1 rounded-2xl h-14 border-sp-border text-sp-muted font-bold flex gap-2">
                    <ImageIcon size={18} /> Attach Evidence
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex-1 gradient-card-purple text-white rounded-2xl h-14 font-black uppercase tracking-widest shadow-xl shadow-sp-purple/20 hover:scale-105 active:scale-95 transition-all"
                  >
                    {submitting ? <Loader2 size={18} className="animate-spin" /> : 'File Ticket'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

