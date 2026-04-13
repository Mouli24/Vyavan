import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { 
  ShoppingCart, 
  Search, 
  Building2, 
  User, 
  Calendar, 
  ChevronRight,
  Filter,
  Loader2,
  Package,
  DollarSign,
  ArrowUpDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    // We'll use getAdminOrders or a generic getOrders with admin context
    // server.js shows /api/orders exists and api.ts has getOrders()
    // Admin likely sees all orders or needs a specific admin route.
    // I'll stick to a wide fetch or check the admin routes in backend.
    api.getOrders().then(data => {
      setOrders(data || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filtered = orders.filter(o => {
    const matchesSearch = 
      o.orderId?.toLowerCase().includes(search.toLowerCase()) ||
      o.buyer?.name?.toLowerCase().includes(search.toLowerCase()) ||
      o.manufacturer?.name?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-sp-purple animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-5 sm:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-sp-text tracking-tight">System Orders</h1>
          <p className="text-sp-muted text-sm mt-0.5">Global transaction monitoring</p>
        </div>
        <div className="flex gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-sp-placeholder" size={16} />
            <Input 
              placeholder="Search orders..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9 rounded-xl border-sp-border bg-white shadow-sm text-sm focus:ring-sp-purple/20"
            />
          </div>
          <select 
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="h-9 px-3 rounded-xl border border-sp-border bg-white shadow-sm text-xs font-medium text-sp-text outline-none focus:border-sp-purple focus:ring-2 focus:ring-sp-purple/10 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="In Production">In Production</option>
            <option value="Shipped">Shipped</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div>
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl py-16 text-center border border-sp-border-light shadow-card">
            <ShoppingCart className="w-10 h-10 mx-auto mb-3 text-sp-border" />
            <p className="font-semibold text-sp-text text-sm">No matching orders</p>
            <p className="text-xs text-sp-muted mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-sp-border-light shadow-card overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-sp-border-light bg-sp-bg/60">
                  <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-sp-muted">Order ID</th>
                  <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-sp-muted">Stakeholders</th>
                  <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-sp-muted">Value</th>
                  <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-sp-muted">Status</th>
                  <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-sp-muted">Date</th>
                  <th className="px-5 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wider text-sp-muted">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sp-border-light">
                {filtered.map((order) => (
                  <tr key={order._id} className="hover:bg-sp-bg/40 transition-colors group">
                    <td className="px-5 py-4">
                      <span className="font-mono text-xs font-semibold text-sp-text bg-sp-bg px-2 py-1 rounded-lg">{order.orderId}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <User size={11} className="text-sp-muted shrink-0" />
                          <p className="text-xs font-medium text-sp-text truncate max-w-[140px]">{order.buyer?.name || 'Buyer'}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Building2 size={11} className="text-sp-muted shrink-0" />
                          <p className="text-xs text-sp-muted truncate max-w-[140px]">{order.manufacturer?.company || 'Manufacturer'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-semibold text-sp-purple">{order.value || '₹0'}</span>
                    </td>
                    <td className="px-5 py-4">
                      <Badge className={`rounded-full px-2.5 py-1 text-[10px] font-semibold border-none ${
                        order.status === 'Delivered' ? 'bg-sp-mint text-sp-success' :
                        order.status === 'In Production' ? 'bg-sp-purple-pale text-sp-purple' :
                        order.status === 'Cancelled' ? 'bg-red-50 text-red-600' :
                        'bg-sp-bg text-sp-muted'
                      }`}>
                        {order.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-sp-muted">
                        <Calendar size={12} /> {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8 hover:bg-sp-purple-pale hover:text-sp-purple">
                        <ChevronRight size={16} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
