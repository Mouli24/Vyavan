import { useState } from 'react';
import ComplaintList from '@/features/complaints/ComplaintList';
import DisputeDetail from '@/features/complaints/DisputeDetail';
import { Search, Bell, Globe, Settings } from 'lucide-react';
import { Complaint } from '@/lib/api';

export default function Complaints() {
  const [selected, setSelected] = useState<Complaint | undefined>();

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-brand-cream">
      {/* TopBar */}
      <div className="h-20 flex items-center justify-between px-8 border-b border-brand-border flex-shrink-0">
        <div className="relative w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search disputes..."
            className="w-full bg-white/50 border-none rounded-2xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-brand-peach outline-none transition-all"
          />
        </div>
        <div className="flex items-center gap-6">
          <button className="text-gray-500 hover:text-brand-charcoal transition-colors"><Bell size={20} /></button>
          <button className="text-gray-500 hover:text-brand-charcoal transition-colors"><Globe size={20} /></button>
          <button className="text-gray-500 hover:text-brand-charcoal transition-colors"><Settings size={20} /></button>
          <div className="w-10 h-10 bg-brand-charcoal rounded-full flex items-center justify-center text-white overflow-hidden border-2 border-white shadow-sm">
            <img
              src="https://picsum.photos/seed/user/100/100"
              alt="User"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-8 pt-4 flex flex-col gap-8 overflow-hidden">
        <header className="space-y-1.5 flex-shrink-0">
          <h1 className="text-2xl font-bold text-brand-charcoal tracking-tight">Resolution Center</h1>
          <p className="text-gray-500 max-w-2xl text-sm leading-relaxed">
            Manage industrial quality disputes and buyer escalations with precision and care.
          </p>
        </header>

        <div className="flex-1 flex gap-10 overflow-hidden min-h-0">
          <ComplaintList onSelect={setSelected} selected={selected?._id} />
          <DisputeDetail complaint={selected} onResolved={c => setSelected(c)} />
        </div>
      </div>
    </div>
  );
}
