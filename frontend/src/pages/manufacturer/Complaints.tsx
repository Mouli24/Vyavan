import { useState } from 'react';
import ComplaintList from '@/features/complaints/ComplaintList';
import DisputeDetail from '@/features/complaints/DisputeDetail';
import { Search, Bell, Globe, Settings } from 'lucide-react';
import { Complaint } from '@/lib/api';

export default function Complaints() {
  const [selected, setSelected] = useState<Complaint | undefined>();

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden" style={{ background: '#FAF8F5' }}>

      {/* Content */}
      <div className="flex-1 p-8 pt-6 flex flex-col gap-6 overflow-hidden">
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
