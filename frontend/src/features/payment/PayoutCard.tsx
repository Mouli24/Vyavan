import { CalendarDays } from 'lucide-react';
import { motion } from 'motion/react';

export default function PayoutCard({ isLoading, data }: any) {
  if (isLoading) {
    return (
      <div className="bg-white p-7 rounded-3xl flex flex-col gap-6 border border-gray-100 shadow-sm h-full animate-pulse h-[350px]">
        <div className="flex gap-2 items-center"><div className="w-2 h-2 bg-gray-200 rounded-full" /><div className="h-3 bg-gray-200 rounded w-1/3" /></div>
        <div className="flex justify-between mt-2">
          <div className="space-y-3 flex-1"><div className="h-5 bg-gray-200 rounded w-1/2" /><div className="h-4 bg-gray-200 rounded w-3/4" /></div>
          <div className="w-12 h-12 bg-gray-200 rounded-xl" />
        </div>
        <div className="mt-auto space-y-5 pt-4 border-t border-gray-100">
           <div className="h-4 bg-gray-200 rounded w-full" />
           <div className="h-4 bg-gray-200 rounded w-full" />
           <div className="h-4 bg-gray-200 rounded w-full" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="bg-white text-gray-800 p-7 rounded-3xl flex flex-col gap-6 relative overflow-hidden border border-gray-100 shadow-sm h-full"
    >
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <span className="text-[11px] text-gray-500 uppercase tracking-wider font-bold">Active Settlement Cycle</span>
      </div>
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-bold mb-1.5 text-gray-900">Automated Payout</h3>
          <p className="text-sm text-gray-500 leading-relaxed pr-4">
            Next transfer to {data.bankName} ending in ****{data.accountLast4}.
          </p>
        </div>
        <div className="w-12 h-12 bg-[#FAF8F5] rounded-xl flex items-center justify-center flex-shrink-0 border border-[#EBDBC8]/50">
          <CalendarDays size={22} className="text-[#8B4513]" />
        </div>
      </div>
      <div className="mt-auto space-y-4 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 font-medium">Settlement ID</span>
          <span className="font-bold text-gray-900">{data.settlementId}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 font-medium">Expected Date</span>
          <span className="font-bold text-gray-900">{data.expectedDate}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 font-medium">Status</span>
          <div className="bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest border border-amber-200/50">
            {data.status}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
