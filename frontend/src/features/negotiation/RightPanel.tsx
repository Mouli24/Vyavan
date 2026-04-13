import { FileText, XCircle, PenLine, Sparkles } from 'lucide-react';

export function RightPanel() {
  return (
    <aside className="w-80 bg-white border-l border-muted flex flex-col h-full p-8">
      <div className="mb-10">
        <h3 className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase mb-6">Deal Overview</h3>
        <div className="space-y-6">
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Proposed Price</p>
            <p className="text-2xl font-bold text-slate-900">$42,500.00</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Margin %</p>
            <p className="text-2xl font-bold text-slate-900">24.5%</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase mb-3">Logistics Phase</p>
            <div className="flex items-center gap-4">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className={`w-2 h-2 rounded-full ${i <= 2 ? 'bg-accent' : 'bg-muted'}`} />
                ))}
              </div>
              <span className="text-xs font-bold text-slate-900">Shipment Pending</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-auto">
        <h3 className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase mb-6">Quick Actions</h3>
        <div className="space-y-3">
          <button className="w-full flex items-center justify-center gap-3 bg-muted/50 text-slate-900 font-bold py-4 rounded-3xl hover:bg-muted transition-colors">
            <PenLine className="w-4 h-4" /> Counter Offer
          </button>
          <button className="w-full flex items-center justify-center gap-3 bg-muted/50 text-slate-900 font-bold py-4 rounded-3xl hover:bg-muted transition-colors">
            <FileText className="w-4 h-4" /> View Contract
          </button>
          <button className="w-full flex items-center justify-center gap-3 bg-red-50 text-red-600 font-bold py-4 rounded-3xl hover:bg-red-100 transition-colors">
            <XCircle className="w-4 h-4" /> Reject Deal
          </button>
        </div>
      </div>

      <div className="bg-purple-50 rounded-[2rem] p-6 border border-purple-100">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <h4 className="text-xs font-bold text-purple-900">Smart Suggestion</h4>
        </div>
        <p className="text-[11px] text-purple-800 leading-relaxed italic">
          "Offering a 2% rebate on future orders might secure this deal without lowering the current unit price."
        </p>
      </div>
    </aside>
  );
}
