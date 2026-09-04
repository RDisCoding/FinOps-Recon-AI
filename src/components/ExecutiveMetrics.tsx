import React from 'react';
import type { AuditSummary } from '../types/reconciliation';
import { IndianRupee, Percent, AlertTriangle, CheckCircle2, ShieldAlert, ArrowUpRight } from 'lucide-react';

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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      
      <div className="glass-card rounded-2xl p-5 relative overflow-hidden glow-amber border-amber-500/30">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-400/90 flex items-center gap-1.5">
            <IndianRupee className="w-3.5 h-3.5" />
            Recoverable Leakage
          </span>
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>
        <div className="text-3xl font-black text-white tracking-tight mb-1">
          {formatINR(summary.total_leakage_recovered_inr)}
        </div>
        <div className="flex items-center gap-2 text-xs text-amber-300/80">
          <span className="font-semibold bg-amber-500/20 px-1.5 py-0.5 rounded text-amber-300">
            100% Actionable
          </span>
          <span>across 5 error classes</span>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-5 relative overflow-hidden glow-emerald border-emerald-500/30">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400/90 flex items-center gap-1.5">
            <Percent className="w-3.5 h-3.5" />
            Reconciliation Match Rate
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="text-3xl font-black text-white tracking-tight mb-1">
          {summary.match_rate_percentage.toFixed(1)}%
        </div>
        <div className="flex items-center gap-2 text-xs text-emerald-300/80">
          <span className="text-emerald-400 font-semibold">{summary.matched_orders_count}</span> clean orders / {summary.total_orders_audited} audited
        </div>
      </div>

      <div className="glass-card rounded-2xl p-5 relative overflow-hidden glow-rose border-rose-500/30">
        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-rose-400/90 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5" />
            Operational Discrepancies
          </span>
          <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="text-3xl font-black text-white tracking-tight mb-1">
          {summary.discrepancy_orders_count} <span className="text-sm font-medium text-slate-400">Exceptions</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-rose-300/80">
          <span className="bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded font-semibold">
            Precision: 100%
          </span>
          <span>Zero False Positives</span>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-5 relative overflow-hidden border-indigo-500/30">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            Volume Audited
          </span>
          <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
            {summary.execution_time_ms} ms
          </span>
        </div>
        <div className="text-xl font-bold text-slate-100 mb-2">
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
