import React from 'react';
import { Play, Download, Sliders, CheckCircle, AlertTriangle } from 'lucide-react';
import type { AuditSummary, ReconciliationException } from '../types/reconciliation';

interface AuditRunnerControlsProps {
  onRunAudit: (count: number, injectErrors: boolean) => void;
  recordCount: number;
  setRecordCount: (count: number) => void;
  injectErrors: boolean;
  setInjectErrors: (val: boolean) => void;
  summary: AuditSummary;
  exceptions: ReconciliationException[];
}

export const AuditRunnerControls: React.FC<AuditRunnerControlsProps> = ({
  onRunAudit,
  recordCount,
  setRecordCount,
  injectErrors,
  setInjectErrors,
  exceptions
}) => {

  const handleExportCSV = () => {
    if (exceptions.length === 0) {
      alert('No exceptions to export in current batch.');
      return;
    }

    const headers = [
      'Exception ID',
      'Order ID',
      'Settlement ID',
      'Payout Batch ID',
      'Error Type',
      'Severity',
      'Title',
      'Expected Value',
      'Actual Value',
      'Financial Leakage (INR)',
      'Timestamp'
    ];

    const rows = exceptions.map(ex => [
      ex.id,
      ex.order_id,
      ex.settlement_id || 'N/A',
      ex.payout_batch_id || 'N/A',
      ex.error_type,
      ex.severity,
      `"${ex.title.replace(/"/g, '""')}"`,
      `"${ex.expected_value.replace(/"/g, '""')}"`,
      `"${ex.actual_value.replace(/"/g, '""')}"`,
      ex.financial_leakage.toFixed(2),
      ex.timestamp
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Razorpay_Recon_Exception_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="glass-card rounded-2xl p-5 mb-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <Sliders className="w-4 h-4 text-indigo-400" />
            <span className="font-semibold text-slate-200">Synthetic Batch Config:</span>
          </div>

          <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800 text-xs">
            {[100, 500, 1000].map(count => (
              <button
                key={count}
                onClick={() => {
                  setRecordCount(count);
                  onRunAudit(count, injectErrors);
                }}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  recordCount === count
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {count} Records
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              const next = !injectErrors;
              setInjectErrors(next);
              onRunAudit(recordCount, next);
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
              injectErrors
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
            }`}
          >
            {injectErrors ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>25 Errors Injected</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Clean Batch (0 Errors)</span>
              </>
            )}
          </button>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <button
            onClick={() => onRunAudit(recordCount, injectErrors)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
          >
            <Play className="w-3.5 h-3.5 text-cyan-400" />
            Re-Audit Current Batch
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            Export Audit Ledger (CSV)
          </button>
        </div>

      </div>
    </div>
  );
};
