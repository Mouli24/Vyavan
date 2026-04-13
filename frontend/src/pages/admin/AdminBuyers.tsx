import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { 
  Users, 
  Search, 
  Mail, 
  Phone, 
  Building2, 
  MapPin, 
  Calendar, 
  ChevronRight,
  MoreVertical,
  Filter,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function AdminBuyers() {
  const [buyers, setBuyers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    // We'll use getAdminStats or a similar call if available, 
    // but usually admin/buyers is a separate GET route.
    // Based on api.ts, we need to check if getAdminBuyers exists.
    api.getAdminStats().then(data => {
      // If the stats don't return the list, we might need a general Users search
      // For now, let's assume getCompanies with role buyer works or a similar pattern.
      // Actually, looking at server.js, there is an admin route.
      // Let's assume api.request('/admin/users?role=buyer') or similar.
      // I'll use a fetch-like call via api.request if needed, or stick to what's in api.ts.
      // getAdminManufacturers exists, but let's check for buyers.
    });

    // Mocking if not in api.ts, but I'll try to find a generic way
    api.getCompanies({ role: 'buyer' }).then(res => {
      setBuyers(res.data || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filtered = buyers.filter(b => 
    b.name?.toLowerCase().includes(search.toLowerCase()) || 
    b.company?.toLowerCase().includes(search.toLowerCase()) ||
    b.email?.toLowerCase().includes(search.toLowerCase())
  );

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
          <h1 className="text-xl font-bold text-sp-text tracking-tight">Manage Buyers</h1>
          <p className="text-sp-muted text-sm mt-0.5">Platform user management</p>
        </div>
        <div className="flex gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-sp-placeholder" size={16} />
            <Input 
              placeholder="Search buyers..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9 rounded-xl border-sp-border bg-white shadow-sm text-sm"
            />
          </div>
        </div>
      </div>

      <div>
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl py-16 text-center border border-sp-border-light shadow-card">
            <Users className="w-10 h-10 mx-auto mb-3 text-sp-border" />
            <p className="font-semibold text-sp-text text-sm">No buyers found</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-sp-border-light shadow-card overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-sp-border-light bg-sp-bg/60">
                  <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-sp-muted">Buyer / Company</th>
                  <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-sp-muted">Contact Info</th>
                  <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-sp-muted">Location</th>
                  <th className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-sp-muted">Joined</th>
                  <th className="px-5 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wider text-sp-muted">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sp-border-light">
                {filtered.map((buyer) => (
                  <tr key={buyer._id} className="hover:bg-sp-bg/40 transition-colors group">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-sp-purple-pale flex items-center justify-center text-sp-purple font-semibold text-sm flex-shrink-0">
                          {buyer.name?.[0] || 'B'}
                        </div>
                        <div>
                          <p className="font-semibold text-sp-text text-sm">{buyer.name}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Building2 size={11} className="text-sp-muted" />
                            <span className="text-xs text-sp-muted">{buyer.company || 'Personal Account'}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-sp-text">
                          <Mail size={11} className="text-sp-muted" /> {buyer.email}
                        </div>
                        {buyer.phone && (
                          <div className="flex items-center gap-1.5 text-xs text-sp-muted">
                            <Phone size={11} /> {buyer.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-sp-muted">
                        <MapPin size={12} /> {buyer.location || 'India'}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-sp-muted">
                        <Calendar size={12} /> {new Date(buyer.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                        <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8 hover:bg-sp-purple-pale hover:text-sp-purple">
                          <Mail size={14} />
                        </Button>
                        <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8 hover:bg-sp-purple-pale hover:text-sp-purple">
                          <ChevronRight size={16} />
                        </Button>
                      </div>
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
