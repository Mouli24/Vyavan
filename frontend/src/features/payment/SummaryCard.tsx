import { LucideIcon, TrendingUp, DollarSign, Wallet, FileText, BarChart3, Clock, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';

interface SummaryCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: string;
  isNeutral?: boolean;
  loading?: boolean;
}

export default function SummaryCard({ title, value, subtitle, trend, isNeutral, loading }: SummaryCardProps) {
  // Determine icon based on title
  const getIcon = () => {
    const t = title.toLowerCase();
    if (t.includes('earned')) return <DollarSign size={20} />;
    if (t.includes('pending')) return <Clock size={20} />;
    if (t.includes('revenue')) return <BarChart3 size={20} />;
    if (t.includes('cycle')) return <RefreshCw size={20} />;
    return <FileText size={20} />;
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm animate-pulse space-y-4">
        <div className="w-12 h-12 bg-gray-50 rounded-2xl" />
        <div className="space-y-2">
          <div className="h-2 bg-gray-50 rounded w-1/3" />
          <div className="h-6 bg-gray-50 rounded w-2/3" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-card group relative overflow-hidden flex flex-col justify-between min-h-[160px]"
    >
      <div className="flex justify-between items-start">
        <div className="w-12 h-12 bg-[#FAF8F5] rounded-2xl flex items-center justify-center text-[#8B4513] border border-[#EBDBC8]/50 group-hover:scale-110 transition-transform">
          {getIcon()}
        </div>
        {trend && (
          <div className={`px-2 py-1 rounded-lg text-[10px] font-black flex items-center gap-1 ${isNeutral ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'}`}>
            {!isNeutral && <TrendingUp size={12} />}
            {trend}
          </div>
        )}
      </div>

      <div className="mt-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{title}</p>
        <h3 className="text-2xl font-black text-gray-900 tracking-tight">{value}</h3>
        {subtitle && <p className="text-[10px] font-bold text-gray-400 mt-1">{subtitle}</p>}
      </div>
    </motion.div>
  );
}
