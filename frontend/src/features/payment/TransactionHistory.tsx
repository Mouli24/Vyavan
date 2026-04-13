import { useState, useEffect, useMemo } from 'react';
import { 
  useReactTable, 
  getCoreRowModel, 
  flexRender, 
  createColumnHelper 
} from '@tanstack/react-table';
import { 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  ArrowDownToLine, 
  ExternalLink,
  CircleDot,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '@/lib/api';
import { useDebounce } from 'use-debounce';

interface Transaction {
  id: string;
  date: string;
  transactionId: string;
  type: string;
  orderId: string;
  amount: number;
  status: string;
}

export default function TransactionHistory() {
  const [data, setData] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search, 500);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const limit = 10;

  useEffect(() => {
    fetchData();
  }, [page, debouncedSearch, typeFilter, statusFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.getTransactions({ 
        page, 
        limit, 
        type: typeFilter || undefined, 
        status: statusFilter || undefined, 
        search: debouncedSearch || undefined 
      });
      setData(res.data);
      setTotal(res.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const columnHelper = createColumnHelper<Transaction>();

  const columns = useMemo(() => [
    columnHelper.accessor('date', {
      header: 'Date',
      cell: info => <span className="font-bold text-gray-900">{info.getValue()}</span>,
    }),
    columnHelper.accessor('transactionId', {
      header: 'Transaction ID',
      cell: info => <span className="font-mono text-gray-400 text-xs">{info.getValue()}</span>,
    }),
    columnHelper.accessor('type', {
      header: 'Type',
      cell: info => {
        const type = info.getValue();
        const colors: any = {
          'Order Payment': 'text-blue-600 bg-blue-50',
          'Refund': 'text-purple-600 bg-purple-50',
          'Platform Fee': 'text-orange-600 bg-orange-50',
          'Payout': 'text-indigo-600 bg-indigo-50'
        };
        return (
          <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex ${colors[type]}`}>
            {type}
          </div>
        );
      },
    }),
    columnHelper.accessor('orderId', {
      header: 'Order ID',
      cell: info => (
        <div className="flex items-center gap-1.5 font-bold text-gray-900">
          {info.getValue()}
          {info.getValue() !== 'N/A' && <ExternalLink size={12} className="text-gray-300" />}
        </div>
      ),
    }),
    columnHelper.accessor('amount', {
      header: 'Amount',
      cell: info => {
        const val = info.getValue();
        const isNeg = val < 0;
        return (
          <span className={`font-black ${isNeg ? 'text-red-500' : 'text-gray-900'}`}>
            {isNeg ? '-' : '+'}₹{Math.abs(val).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        );
      },
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: info => {
        const status = info.getValue();
        const config: any = {
          'COMPLETED': 'bg-green-500',
          'PENDING': 'bg-amber-500',
          'FAILED': 'bg-red-500'
        };
        return (
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${config[status]}`} />
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-900">{status}</span>
          </div>
        );
      },
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: () => (
        <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-[#8B4513]">
          <ArrowDownToLine size={18} />
        </button>
      ),
    }),
  ], []);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="mt-12 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h4 className="text-2xl font-black text-gray-900 leading-tight">Transaction History</h4>
          <p className="text-sm font-bold text-gray-400 mt-1">Track every rupee moving in and out of your atelier.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text"
              placeholder="Search IDs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white border border-gray-100 rounded-2xl h-11 pl-11 pr-4 text-sm font-bold focus:border-[#8B4513] outline-none transition-all w-48 focus:w-64"
            />
          </div>

          {/* Filters */}
          <select 
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-white border border-gray-100 rounded-2xl h-11 px-4 text-xs font-black uppercase tracking-widest text-gray-600 outline-none cursor-pointer hover:border-gray-200 transition-all"
          >
            <option value="">All Types</option>
            <option value="Order Payment">Payments</option>
            <option value="Payout">Payouts</option>
            <option value="Refund">Refunds</option>
            <option value="Platform Fee">Fees</option>
          </select>

          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-gray-100 rounded-2xl h-11 px-4 text-xs font-black uppercase tracking-widest text-gray-600 outline-none cursor-pointer hover:border-gray-200 transition-all"
          >
            <option value="">All Status</option>
            <option value="COMPLETED">Completed</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm relative">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id} className="border-b border-gray-50 bg-[#FAF8F5]/50">
                  {headerGroup.headers.map(header => (
                    <th key={header.id} className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-8 py-6">
                        <div className="h-4 bg-gray-100 rounded w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                table.getRowModel().rows.map(row => (
                  <motion.tr 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={row.id} 
                    className="hover:bg-gray-50/50 transition-colors group cursor-pointer"
                  >
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="px-8 py-6 text-sm">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && data.length === 0 && (
          <div className="p-20 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-200 mb-4">
              <CircleDot size={32} />
            </div>
            <h5 className="font-bold text-gray-900">No transactions found</h5>
            <p className="text-xs text-gray-400 mt-1 font-medium">Try adjusting your filters or search query.</p>
          </div>
        )}

        {/* Pagination */}
        <div className="px-8 py-6 border-t border-gray-50 flex items-center justify-between bg-[#FAF8F5]/30">
          <p className="text-xs font-bold text-gray-400">
            Showing <span className="text-gray-900">{(page-1)*limit + 1}</span> to <span className="text-gray-900">{Math.min(page*limit, total)}</span> of <span className="text-gray-900">{total}</span>
          </p>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setPage(p => Math.max(1, p-1))}
              disabled={page === 1}
              className="w-10 h-10 border border-gray-100 rounded-xl flex items-center justify-center text-gray-400 hover:text-[#8B4513] hover:border-[#8B4513] transition-all disabled:opacity-30 disabled:hover:text-gray-400 disabled:hover:border-gray-100"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${
                    page === i + 1 
                      ? 'bg-[#8B4513] text-white shadow-lg shadow-[#8B4513]/20' 
                      : 'text-gray-400 hover:bg-gray-100'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button 
              onClick={() => setPage(p => Math.min(totalPages, p+1))}
              disabled={page === totalPages || totalPages === 0}
              className="w-10 h-10 border border-gray-100 rounded-xl flex items-center justify-center text-gray-400 hover:text-[#8B4513] hover:border-[#8B4513] transition-all disabled:opacity-30 disabled:hover:text-gray-400 disabled:hover:border-gray-100"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
