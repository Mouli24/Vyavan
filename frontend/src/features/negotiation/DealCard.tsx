import { Deal } from './types';
import { cn } from '@/lib/utils';

interface DealCardProps {
  deal: Deal;
  active?: boolean;
}

export function DealCard({ deal, active }: DealCardProps) {
  return (
    <div className={cn(
      'p-5 rounded-3xl bg-white transition-all cursor-pointer border-2',
      active ? 'border-accent shadow-md' : 'border-transparent hover:border-muted'
    )}>
      <div className="flex justify-between items-start mb-2">
        <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">{deal.priority} PRIORITY</span>
        <span className="text-[10px] text-muted-foreground">{deal.time}</span>
      </div>
      <h3 className="font-bold text-slate-900 mb-1">{deal.title}</h3>
      <p className="text-xs text-muted-foreground mb-4">{deal.subtitle}</p>

      <div className="flex justify-between items-center">
        <span className={cn(
          'px-3 py-1 rounded-full text-[10px] font-bold',
          deal.status === 'Negotiating' ? 'bg-highlight text-accent' :
          deal.status === 'Waiting' ? 'bg-blue-50 text-blue-600' :
          'bg-purple-50 text-purple-600'
        )}>
          {deal.status}
        </span>
        <span className="font-bold text-slate-900">{deal.price}</span>
      </div>
    </div>
  );
}
