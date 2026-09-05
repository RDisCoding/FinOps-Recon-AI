import React, { useState } from 'react';
import type { ReconciliationException, ErrorType } from '../types/reconciliation';
import { ShieldAlert, IndianRupee, ArrowRight, Copy, Check } from 'lucide-react';

interface ExceptionLedgerProps {
  exceptions: ReconciliationException[];
  onSelectException: (ex: ReconciliationException) => void;
}

export const ExceptionLedger: React.FC<ExceptionLedgerProps> = ({
  exceptions,
  onSelectException
}) => {
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredExceptions = exceptions.filter(ex => {
    if (selectedType === 'ALL') return true;
    return ex.error_type === selectedType;
  });

  const handleCopyTicket = (ex: ReconciliationException, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(ex.dispute_ticket_draft);
    setCopiedId(ex.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getErrorTypeColor = (type: ErrorType) => {
    switch (type) {
      case 'MDR_OVERCHARGE': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'GST_MISCALCULATION': return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      case 'GHOST_PAYOUT': return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
      case 'DOUBLE_REFUND': return 'text-red-400 bg-red-500/10 border-red-500/30';
      case 'PROMO_MISALLOCATION': return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
    }
  };

  return (
    <div className="glass-card rounded-xl p-5 mb-6">
      
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-300" />
            Exception queue
          </h2>
          <p className="text-xs text-slate-400">
            Review root causes, affected orders, and potential recovery.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5 bg-slate-900/70 p-1 rounded-md border border-slate-700 text-xs">
          {['ALL', 'MDR_OVERCHARGE', 'GST_MISCALCULATION', 'GHOST_PAYOUT', 'DOUBLE_REFUND', 'PROMO_MISALLOCATION'].map(type => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                selectedType === type
                  ? 'bg-slate-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {type === 'ALL' ? `All (${exceptions.length})` : type.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filteredExceptions.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            No exceptions found in selected filter category.
          </div>
        ) : (
          filteredExceptions.map(ex => (
            <div
              key={ex.id}
              onClick={() => onSelectException(ex)}
              className="p-4 rounded-lg bg-slate-900/50 hover:bg-slate-800/60 border border-slate-700/70 hover:border-slate-500 transition-all cursor-pointer group"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase border ${getErrorTypeColor(ex.error_type)}`}>
                      {ex.error_type.replace('_', ' ')}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white text-sm">{ex.order_id}</span>
                      <span className="text-xs text-slate-400">• Batch: {ex.payout_batch_id || 'N/A'}</span>
                    </div>
                    <h3 className="text-xs font-semibold text-slate-200 mt-0.5">{ex.title}</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-2xl">{ex.description}</p>
                    
                    <div className="flex items-center gap-4 mt-2 text-xs font-mono">
                      <span className="text-slate-400">Expected: <strong className="text-emerald-400">{ex.expected_value}</strong></span>
                      <ArrowRight className="w-3 h-3 text-slate-600" />
                      <span className="text-slate-400">Actual: <strong className="text-rose-400">{ex.actual_value}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 border-slate-800/80 pt-3 md:pt-0">
                  <div className="text-right">
                    <div className="eyebrow text-amber-300">Potential recovery</div>
                    <div className="text-lg font-bold text-rose-300 flex items-center justify-end tabular-nums">
                      <IndianRupee className="w-4 h-4" />
                      {ex.financial_leakage.toFixed(2)}
                    </div>
                  </div>

                  <button
                    onClick={(e) => handleCopyTicket(ex, e)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-transparent hover:bg-slate-800 text-slate-300 border border-slate-700 transition-all cursor-pointer"
                    title="Copy Razorpay Merchant Support Dispute Ticket"
                  >
                    {copiedId === ex.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Dispute Ticket</span>
                      </>
                    )}
                  </button>
                </div>

              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};
