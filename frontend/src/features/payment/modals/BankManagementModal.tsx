import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Landmark, Plus, Trash2, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';

export default function BankManagementModal({ isOpen, onClose }: any) {
  const [banks, setBanks] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form state
  const [newBank, setNewBank] = useState({
    accountName: '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',
    isPrimary: false
  });

  useEffect(() => {
    if (isOpen) fetchBanks();
  }, [isOpen]);

  const fetchBanks = async () => {
    try {
      const res = await api.getBanks();
      setBanks(res);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddBank = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.addBank(newBank);
      setShowAddForm(false);
      setNewBank({ accountName: '', accountNumber: '', ifscCode: '', bankName: '', isPrimary: false });
      fetchBanks();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBank = async (id: string) => {
    if (!confirm('Are you sure you want to remove this bank account?')) return;
    try {
      await api.deleteBank(id);
      fetchBanks();
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
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
          className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]"
        >
          <div className="p-8 pb-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-mfr-peach rounded-2xl flex items-center justify-center text-mfr-brown">
                <Landmark size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-gray-900 leading-tight">Bank Management</h3>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Payout Settings</p>
              </div>
            </div>
            <button onClick={() => onClose()} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 pt-4 space-y-8">
            {!showAddForm ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest pl-1">Linked Accounts</h4>
                  <button 
                    onClick={() => setShowAddForm(true)}
                    className="flex items-center gap-2 text-xs font-black text-[#8B4513] hover:text-[#703810] transition-colors"
                  >
                    <Plus size={16} /> Add New Account
                  </button>
                </div>

                <div className="space-y-4">
                  {banks.map((bank) => (
                    <div 
                      key={bank._id}
                      className={`p-6 rounded-[2rem] border-2 flex items-center justify-between group transition-all ${
                        bank.isPrimary ? 'border-[#8B4513] bg-[#FAF8F5]' : 'border-gray-50 bg-white hover:border-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-5">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${bank.isPrimary ? 'bg-[#8B4513] text-white' : 'bg-gray-100 text-gray-400'}`}>
                          <Landmark size={20} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                             <h5 className="font-black text-gray-900">{bank.bankName}</h5>
                             {bank.isPrimary && <span className="text-[10px] font-black uppercase text-[#8B4513] bg-[#8B4513]/10 px-2 py-0.5 rounded-md">Primary</span>}
                          </div>
                          <p className="text-xs font-bold text-gray-400 mt-0.5">XXXX {bank.accountNumber.slice(-4)} ?" {bank.accountName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                         {!bank.isPrimary && (
                           <button onClick={() => handleDeleteBank(bank._id)} className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                             <Trash2 size={18} />
                           </button>
                         )}
                         <div className={`w-8 h-8 rounded-full flex items-center justify-center ${bank.isPrimary ? 'text-[#8B4513]' : 'text-gray-100'}`}>
                           <CheckCircle2 size={24} />
                         </div>
                      </div>
                    </div>
                  ))}
                  {banks.length === 0 && (
                    <div className="text-center py-10 space-y-3">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mx-auto">
                        <Landmark size={32} />
                      </div>
                      <p className="text-sm font-bold text-gray-400">No bank accounts linked yet.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <form onSubmit={handleAddBank} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="bg-amber-50 p-4 rounded-2xl flex items-start gap-3 border border-amber-200/50">
                  <AlertCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs font-bold text-amber-700 leading-relaxed">
                    Account name must exactly match your business documents for successful verification and payouts.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Account Holder Name</label>
                    <input 
                      required
                      value={newBank.accountName}
                      onChange={e => setNewBank({...newBank, accountName: e.target.value})}
                      className="w-full h-14 bg-gray-50 border-2 border-transparent rounded-2xl px-5 text-sm font-bold focus:bg-white focus:border-[#8B4513] outline-none transition-all" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Bank Name</label>
                    <input 
                      required
                      value={newBank.bankName}
                      onChange={e => setNewBank({...newBank, bankName: e.target.value})}
                      className="w-full h-14 bg-gray-50 border-2 border-transparent rounded-2xl px-5 text-sm font-bold focus:bg-white focus:border-[#8B4513] outline-none transition-all" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Account Number</label>
                    <input 
                      required
                      value={newBank.accountNumber}
                      onChange={e => setNewBank({...newBank, accountNumber: e.target.value})}
                      className="w-full h-14 bg-gray-50 border-2 border-transparent rounded-2xl px-5 text-sm font-bold focus:bg-white focus:border-[#8B4513] outline-none transition-all" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">IFSC Code</label>
                    <input 
                      required
                      value={newBank.ifscCode}
                      onChange={e => setNewBank({...newBank, ifscCode: e.target.value})}
                      className="w-full h-14 bg-gray-50 border-2 border-transparent rounded-2xl px-5 text-sm font-bold focus:bg-white focus:border-[#8B4513] outline-none transition-all" 
                    />
                  </div>
                </div>

                <label className="flex items-center gap-3 cursor-pointer p-1">
                  <input 
                    type="checkbox"
                    checked={newBank.isPrimary}
                    onChange={e => setNewBank({...newBank, isPrimary: e.target.checked})}
                    className="w-5 h-5 rounded-md border-2 border-gray-200 text-[#8B4513] focus:ring-[#8B4513]" 
                  />
                  <span className="text-xs font-bold text-gray-600">Set as primary account for future payouts</span>
                </label>

                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <button 
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 h-14 rounded-2xl border-2 border-gray-100 text-sm font-black text-gray-400 uppercase tracking-widest hover:border-gray-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={loading}
                    className="flex-[2] h-14 bg-[#8B4513] text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-[#703810] disabled:opacity-50 transition-all shadow-xl shadow-[#8B4513]/20"
                  >
                    {loading ? 'Verifying...' : 'Save Bank Account'}
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="p-8 pt-0 flex-shrink-0">
            <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#10B981]">
              <ShieldCheck size={14} />
              Bank details are encrypted and stored securely
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
