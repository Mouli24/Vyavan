import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, FileDown, CheckCircle2, FileText, Table as TableIcon } from 'lucide-react';
import { api } from '@/lib/api';

export default function ReportModal({ isOpen, onClose }: any) {
  const [type, setType] = useState('Earnings Summary');
  const [period, setPeriod] = useState('Last 6 months');
  const [format, setFormat] = useState<'pdf' | 'excel'>('pdf');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await api.generateCustomReport({ type, period, format });
      const blob = new Blob([res], { type: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type.replace(/\s+/g, '-').toLowerCase()}-report.${format === 'pdf' ? 'pdf' : 'xlsx'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => onClose()}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100"
        >
          <div className="p-8 pb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-mfr-peach rounded-2xl flex items-center justify-center text-mfr-brown">
                <FileDown size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-gray-900 leading-tight">Financial Report</h3>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Custom Generation</p>
              </div>
            </div>
            <button onClick={() => onClose()} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400">
              <X size={20} />
            </button>
          </div>

          <div className="p-8 pt-4 space-y-8">
            {/* Report Type */}
            <div className="space-y-4">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Report Type</label>
              <div className="grid grid-cols-1 gap-2">
                {['Earnings Summary', 'Transaction History', 'Tax Report'].map(t => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                      type === t ? 'border-[#8B4513] bg-[#FAF8F5]' : 'border-gray-50 bg-gray-50/30 hover:bg-gray-50'
                    }`}
                  >
                    <span className={`text-sm font-bold ${type === t ? 'text-[#8B4513]' : 'text-gray-600'}`}>{t}</span>
                    {type === t && <CheckCircle2 size={18} className="text-[#8B4513]" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Period */}
            <div className="space-y-4">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Period Selection</label>
              <select 
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full bg-[#FAF8F5] border-2 border-transparent rounded-2xl h-14 px-5 text-sm font-bold focus:border-[#8B4513] outline-none appearance-none cursor-pointer text-gray-700"
              >
                <option>This month</option>
                <option>Last 3 months</option>
                <option>Last 6 months</option>
                <option>Custom range</option>
              </select>
            </div>

            {/* Format */}
            <div className="space-y-4">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Export Format</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setFormat('pdf')}
                  className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                    format === 'pdf' ? 'border-[#8B4513] bg-[#FAF8F5]' : 'border-gray-50 bg-gray-50/30 hover:bg-gray-50'
                  }`}
                >
                  <FileText size={20} className={format === 'pdf' ? 'text-red-500' : 'text-gray-400'} />
                  <span className={`text-sm font-bold ${format === 'pdf' ? 'text-[#8B4513]' : 'text-gray-600'}`}>PDF Document</span>
                </button>
                <button
                  onClick={() => setFormat('excel')}
                  className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                    format === 'excel' ? 'border-[#8B4513] bg-[#FAF8F5]' : 'border-gray-50 bg-gray-50/30 hover:bg-gray-50'
                  }`}
                >
                  <TableIcon size={20} className={format === 'excel' ? 'text-green-600' : 'text-gray-400'} />
                  <span className={`text-sm font-bold ${format === 'excel' ? 'text-[#8B4513]' : 'text-gray-600'}`}>Excel / CSV</span>
                </button>
              </div>
            </div>
          </div>

          <div className="p-8 pt-0">
            <button 
              onClick={handleGenerate}
              disabled={loading}
              className="w-full h-16 bg-[#8B4513] text-white rounded-2xl font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all hover:bg-[#703810] disabled:opacity-50 shadow-xl shadow-[#8B4513]/20"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Generate Report'
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
