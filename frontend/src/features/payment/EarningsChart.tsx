import { useState } from 'react';
import { TrendingUp, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function EarningsChart({ isLoading, data, period, setPeriod }: any) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="bg-white p-7 rounded-3xl shadow-sm border border-gray-100 h-[430px] flex flex-col animate-pulse">
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="h-3 bg-gray-200 rounded w-32 mb-4" />
            <div className="flex items-end gap-4">
              <div className="h-10 bg-gray-200 rounded w-48" />
              <div className="h-6 bg-gray-200 rounded w-24 mb-1" />
            </div>
          </div>
          <div className="h-10 bg-gray-200 rounded-xl w-32" />
        </div>
        <div className="flex-1 bg-gray-100 rounded-xl w-full" />
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg">
          ₹{payload[0].value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </div>
      );
    }
    return null;
  };

  const chartData = data?.monthlyData || [];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white p-7 rounded-3xl shadow-sm border border-gray-100 h-full flex flex-col"
    >
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-[11px] uppercase tracking-wider font-bold text-gray-400 mb-2">Earnings Overview</p>
          <div className="flex items-end gap-4">
            <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">
              ₹{(data?.totalEarnings || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </h2>
            <div className="flex items-center gap-1.5 text-green-600 font-semibold bg-green-50 px-3 py-1 rounded-full text-xs mb-1.5 border border-green-100">
              <TrendingUp size={14} />
              <span>+{data?.changePercentage || 0}% vs. last period</span>
            </div>
          </div>
        </div>
        <select 
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="flex items-center gap-2 bg-[#FAF8F5] text-gray-600 px-4 py-2 rounded-xl text-sm font-semibold border border-[#EBDBC8]/50 hover:bg-[#F0EAE2] transition-colors outline-none cursor-pointer"
        >
          <option value="6months">Last 6 Months</option>
          <option value="12months">Last 12 Months</option>
          <option value="ytd">Year to Date</option>
        </select>
      </div>

      <div className="h-56 w-full mt-auto">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 0, left: -20, right: 0, bottom: 0 }}>
            <XAxis 
              dataKey="month" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 500 }} 
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 500 }}
              tickFormatter={(value) => `₹${value >= 1000 ? (value/1000) + 'K' : value}`}
            />
            <Tooltip 
              content={<CustomTooltip />} 
              cursor={{ fill: '#FAF8F5' }}
            />
            <Bar 
              dataKey="amount" 
              radius={[4, 4, 4, 4]} 
              barSize={32}
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              {chartData.map((entry: any, index: number) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={
                    activeIndex === index 
                      ? '#5C3A21' 
                      : index === chartData.length - 1 
                        ? '#5C3A21' 
                        : '#8B4513'
                  } 
                  className="transition-all duration-300"
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-center hover:bg-gray-50 rounded-xl transition-colors cursor-pointer p-2 group">
        <span className="text-sm font-bold text-[#8B4513] flex items-center gap-1.5">
          View Analytics
          <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </span>
      </div>
    </motion.div>
  );
}
