import React from 'react';
import type { AuditSummary } from '../types/reconciliation';
import { IndianRupee, Percent, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';

interface ExecutiveMetricsProps {
  summary: AuditSummary;
}

export const ExecutiveMetrics: React.FC<ExecutiveMetricsProps> = ({ summary }) => {
  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      
      <div className="glass-card rounded-xl p-5 relative overflow-hidden border-amber-500/30">
        <div className="flex items-center justify-between mb-4">
          <span className="eyebrow text-amber-300 flex items-center gap-1.5"><IndianRupee className="w-3.5 h-3.5" />Potential recovery</span>
          <span className="w-2 h-2 rounded-full bg-amber-400" />
        </div>
        <div className="text-3xl font-bold text-white tracking-tight mb-1 tabular-nums">
          {formatINR(summary.total_leakage_recovered_inr)}
        </div>
        <div className="text-xs text-slate-500">Identified across {Object.keys(summary.errors_by_type).length} exception classes</div>
      </div>

      <div className="glass-card rounded-xl p-5 relative overflow-hidden border-emerald-500/30">
        <div className="flex items-center justify-between mb-4">
          <span className="eyebrow text-emerald-300 flex items-center gap-1.5"><Percent className="w-3.5 h-3.5" />Match rate</span>
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="text-3xl font-bold text-white tracking-tight mb-1 tabular-nums">
          {summary.match_rate_percentage.toFixed(1)}%
        </div>
        <div className="text-xs text-slate-500"><span className="text-emerald-300">{summary.matched_orders_count}</span> matched of {summary.total_orders_audited} audited</div>
      </div>

      <div className="glass-card rounded-xl p-5 relative overflow-hidden border-rose-500/30">
        <div className="flex items-center justify-between mb-4">
          <span className="eyebrow text-rose-300 flex items-center gap-1.5"><ShieldAlert className="w-3.5 h-3.5" />Open exceptions</span>
          <AlertTriangle className="w-4 h-4 text-rose-400" />
        </div>
        <div className="text-3xl font-bold text-white tracking-tight mb-1 tabular-nums">
          {summary.discrepancy_orders_count}
        </div>
        <div className="text-xs text-slate-500">Operational issues requiring review</div>
      </div>

      <div className="glass-card rounded-xl p-5 relative overflow-hidden border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <span className="eyebrow">Volume audited</span>
          <span className="font-mono text-[10px] text-slate-400">{summary.execution_time_ms} ms</span>
        </div>
        <div className="text-xl font-bold text-slate-100 mb-2 tabular-nums">
          {formatINR(summary.total_order_value_inr)}
        </div>
        <div className="space-y-1 text-xs text-slate-400">
          <div className="flex justify-between">
            <span>Razorpay Logs:</span>
            <span className="text-slate-200 font-medium">{formatINR(summary.total_settled_value_inr)}</span>
          </div>
          <div className="flex justify-between">
            <span>Bank Credited:</span>
            <span className="text-emerald-400 font-medium">{formatINR(summary.total_bank_credited_inr)}</span>
          </div>
        </div>
      </div>

    </div>
  );
};
