import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Landmark, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react';
import { api } from '@/lib/api';

interface Bank {
  _id: string;
  bankName: string;
  accountNumber: string;
  isPrimary: boolean;
}

export default function WithdrawModal({ isOpen, onClose, availableBalance, onShowBanks }: any) {
  const [amount, setAmount] = useState<string>('');
  const [selectedBank, setSelectedBank] = useState<string>('');
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.getBanks().then(res => {
        setBanks(res);
        const primary = res.find((b: any) => b.isPrimary);
        if (primary) setSelectedBank(primary._id);
        else if (res.length > 0) setSelectedBank(res[0]._id);
      }).catch(console.error);
    }
  }, [isOpen]);

  const handleWithdraw = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    setLoading(true);
    try {
      await api.withdrawFunds(parseFloat(amount), selectedBank);
      onClose(true); // Success
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
        {/* Overlay */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => onClose()}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100"
        >
          {/* Header */}
          <div className="p-8 pb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
                <Landmark size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-gray-900 leading-tight">Withdraw Funds</h3>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Secure Transfer</p>
              </div>
            </div>
            <button onClick={() => onClose()} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400">
              <X size={20} />
            </button>
          </div>

          <div className="p-8 pt-4 space-y-8">
            {/* Balance Card */}
            <div className="bg-[#FAF8F5] rounded-[2rem] p-6 border border-[#EBDBC8]/50 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-[#8B4513]/60 uppercase tracking-widest mb-1">Available for Withdrawal</p>
                <p className="text-3xl font-black text-gray-900">₹{availableBalance.toLocaleString('en-IN')}</p>
              </div>
              <button 
                onClick={() => setAmount(availableBalance.toString())}
                className="bg-[#8B4513] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#703810] transition-all"
              >
                Withdraw All
              </button>
            </div>

            {/* Form */}
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Withdrawal Amount</label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xl font-black text-gray-400">₹</span>
                  <input 
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full bg-white border-2 border-gray-100 rounded-2xl h-16 pl-10 pr-6 text-xl font-black focus:border-[#8B4513] outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Bank Account</label>
                  <button onClick={onShowBanks} className="text-[10px] font-black text-[#8B4513] uppercase tracking-widest hover:underline">Manage Banks</button>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {banks.length === 0 ? (
                    <button 
                      onClick={onShowBanks}
                      className="w-full border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center text-sm font-bold text-gray-400 hover:border-[#8B4513] hover:text-[#8B4513] transition-all"
                    >
                      + Add a bank account
                    </button>
                  ) : (
                    <select 
                      value={selectedBank}
                      onChange={(e) => setSelectedBank(e.target.value)}
                      className="w-full bg-white border-2 border-gray-100 rounded-2xl h-14 px-5 text-sm font-bold focus:border-[#8B4513] outline-none appearance-none cursor-pointer"
                    >
                      {banks.map(bank => (
                        <option key={bank._id} value={bank._id}>
                          {bank.bankName} - XXXX{bank.accountNumber.slice(-4)} {bank.isPrimary ? '(Primary)' : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Estimate */}
              <div className="flex items-center gap-3 text-xs font-bold text-gray-500 bg-gray-50 p-4 rounded-2xl">
                <HelpCircle size={16} className="text-[#8B4513]" />
                <span>Estimated arrival: <span className="text-gray-900">2-3 business days</span> to your linked account.</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-8 pt-0">
            <button 
              onClick={handleWithdraw}
              disabled={loading || !amount || parseFloat(amount) <= 0 || banks.length === 0}
              className="w-full h-16 bg-[#8B4513] text-white rounded-2xl font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 group transition-all hover:bg-[#703810] disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-[#8B4513]/20"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Confirm Withdrawal
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
            <div className="mt-4 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#10B981]">
              <ShieldCheck size={14} />
              End-to-end encrypted transfer
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
