import { useState, useEffect } from 'react';
import { Download, Wallet, RefreshCw, AlertCircle, TrendingUp, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '@/lib/api';
import { toast, Toaster } from 'react-hot-toast';

// Components
import SummaryCard from '@/features/payment/SummaryCard';
import EarningsChart from '@/features/payment/EarningsChart';
import PayoutCard from '@/features/payment/PayoutCard';
import TransactionHistory from '@/features/payment/TransactionHistory';

// Modals
import WithdrawModal from '@/features/payment/modals/WithdrawModal';
import ReportModal from '@/features/payment/modals/ReportModal';
import BankManagementModal from '@/features/payment/modals/BankManagementModal';

export default function Payment() {
  const [summary, setSummary] = useState<any>(null);
  const [earnings, setEarnings] = useState<any>(null);
  const [activeSettlement, setActiveSettlement] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [period, setPeriod] = useState('6months');

  // Modal states
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isBankOpen, setIsBankOpen] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, [period]);

  const fetchAllData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const [s, e, a] = await Promise.all([
        api.getManufacturerPaymentSummary(),
        api.getManufacturerEarnings(period),
        api.getActiveSettlement(),
      ]);
      setSummary(s);
      setEarnings(e);
      setActiveSettlement(a);
    } catch (err) {
      console.error('Failed to fetch payment data', err);
      toast.error('Failed to sync financial data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleWithdrawSuccess = async (success: boolean) => {
    setIsWithdrawOpen(false);
    if (success) {
      toast.success('Withdrawal request initiated successfully!', {
        icon: '💰',
        style: { borderRadius: '15px', background: '#1A1A1A', color: '#fff', fontSize: '12px', fontWeight: 'bold' }
      });
      fetchAllData(true);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-16">
      <Toaster position="top-right" />
      
      {/* Modals */}
      <WithdrawModal 
        isOpen={isWithdrawOpen} 
        onClose={handleWithdrawSuccess} 
        availableBalance={summary?.pendingPayout || 0}
        onShowBanks={() => { setIsWithdrawOpen(false); setIsBankOpen(true); }}
      />
      <ReportModal 
        isOpen={isReportOpen} 
        onClose={() => setIsReportOpen(false)} 
      />
      <BankManagementModal 
        isOpen={isBankOpen} 
        onClose={() => setIsBankOpen(true)} 
      />

      {/* Breadcrumb & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-[11px] font-medium text-mfr-muted">
            <span>Dashboard</span>
            <span className="text-sp-border">·</span>
            <span className="text-[#8B4513]">Payment</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight leading-tight">
            Your revenue is growing, <span className="text-[#8B4513]">Séphio</span>.
          </h1>
          <p className="text-sm text-gray-400 max-w-xl leading-relaxed">
            Manage payouts, track pending settlements, and analyze your store's financial performance in real-time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsReportOpen(true)}
            className="flex items-center gap-2 px-5 h-10 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-all"
          >
            <Download size={15} /> Download Report
          </button>
          <button 
            onClick={() => setIsWithdrawOpen(true)}
            className="flex items-center gap-2 px-6 h-10 rounded-xl bg-[#8B4513] text-white text-xs font-semibold hover:bg-[#703810] transition-all shadow-sm"
          >
            <Wallet size={15} /> Withdraw Funds
          </button>
        </div>
      </div>

      {/* Alert Banners */}
      <AnimatePresence>
        <div className="space-y-4">
          {summary?.pendingPayout >= 10000 && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-amber-50 border border-amber-200/50 p-4 rounded-3xl flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600">
                  <TrendingUp size={18} />
                </div>
                <div>
                  <p className="text-sm font-black text-amber-900">High Balance Alert</p>
                  <p className="text-xs font-bold text-amber-700/70">You have ₹{summary.pendingPayout.toLocaleString()} pending. Would you like to withdraw now?</p>
                </div>
              </div>
              <button 
                onClick={() => setIsWithdrawOpen(true)}
                className="px-4 py-2 bg-amber-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-amber-700 transition-all"
              >
                Withdraw Now
              </button>
            </motion.div>
          )}

          {/* Simulated Failed Payout Banner */}
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-red-50 border border-red-200/50 p-4 rounded-3xl flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-2xl flex items-center justify-center text-red-500">
                <AlertCircle size={18} />
              </div>
              <div>
                <p className="text-sm font-black text-red-900">Payout Locked</p>
                <p className="text-xs font-bold text-red-700/70">Your last payout failed due to bank verification. Please update details.</p>
              </div>
            </div>
            <button 
              onClick={() => setIsBankOpen(true)}
              className="px-4 py-2 bg-red-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-600 transition-all"
            >
              Resolve Info
            </button>
          </motion.div>
        </div>
      </AnimatePresence>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard 
          title="Total Earned" 
          value={`₹${summary?.totalEarned?.toLocaleString('en-IN')}`} 
          trend={`+${summary?.totalEarnedChange}%`} 
          loading={isLoading}
        />
        <SummaryCard 
          title="Pending Payout" 
          value={`₹${summary?.pendingPayout?.toLocaleString('en-IN')}`} 
          trend="Next: 12 Mar" 
          isNeutral 
          loading={isLoading}
        />
        <SummaryCard 
          title="Net Revenue" 
          value={`₹${summary?.netRevenue?.toLocaleString('en-IN')}`} 
          subtitle="After platform fees & tax" 
          loading={isLoading}
        />
        <SummaryCard 
          title="Settlement Cycle" 
          value="Weekly" 
          subtitle="Automated bank sweeps" 
          isNeutral 
          loading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <EarningsChart 
            isLoading={isLoading} 
            data={earnings} 
            period={period} 
            setPeriod={setPeriod} 
          />
        </div>
        <div>
          <PayoutCard 
            isLoading={isLoading} 
            data={activeSettlement} 
          />
        </div>
      </div>

      <TransactionHistory />

      {/* Bottom info */}
      <div className="bg-[#FAF8F5] rounded-[2.5rem] p-8 border border-[#EBDBC8]/30 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#8B4513] shadow-sm border border-[#EBDBC8]/50">
            <Info size={20} />
          </div>
          <div>
            <h5 className="font-black text-gray-900">Need help with your payments?</h5>
            <p className="text-xs font-bold text-gray-400">Our financial support team is available 24/7 for atelier partners.</p>
          </div>
        </div>
        <button className="px-8 py-3 bg-white border border-gray-100 rounded-2xl text-xs font-black uppercase tracking-widest text-gray-900 hover:bg-gray-50 transition-all shadow-sm">
          Contact Support
        </button>
      </div>
    </div>
  );
}

