import React from 'react';
import type { AuditSummary } from '../types/reconciliation';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { PieChart as PieIcon, BarChart3, Building2, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface AnalyticsViewProps {
  summary: AuditSummary;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ summary }) => {

  const errorData = Object.entries(summary.errors_by_type).map(([key, val]) => ({
    name: key.replace('_', ' '),
    rawKey: key,
    count: val.count,
    leakage: val.leakage_inr
  }));

  const COLORS = ['#d69e2e', '#d97777', '#8aa4c2', '#c46d6d', '#6da5a8'];

  const formatCurrency = (val: number) => `₹${val.toLocaleString('en-IN')}`;

  return (
    <div className="space-y-6 mb-6">
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-400" />
                Financial impact by category
              </h3>
              <p className="text-xs text-slate-400">Total ₹ amount lost per operational discrepancy class</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={errorData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <XAxis 
                  dataKey="name" 
                  stroke="#94a3b8" 
                  fontSize={10} 
                  tickLine={false}
                  interval={0}
                />
                <YAxis stroke="#94a3b8" fontSize={10} tickFormatter={(val) => `₹${val}`} />
                <Tooltip 
                  formatter={(value: any) => [`₹${Number(value).toFixed(2)}`, 'Financial Loss']}
                  contentStyle={{ backgroundColor: '#192331', borderColor: '#3a4a5d', borderRadius: '6px', color: '#fff' }}
                />
                <Bar dataKey="leakage" radius={[6, 6, 0, 0]}>
                  {errorData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-cyan-400" />
                Exception frequency
              </h3>
              <p className="text-xs text-slate-400">Share of total 25 operational errors detected</p>
            </div>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={errorData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {errorData.map((_, index) => (
                    <Cell key={`cell-pie-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(val: any) => [`${val} cases`, 'Occurrences']}
                  contentStyle={{ backgroundColor: '#192331', borderColor: '#3a4a5d', borderRadius: '6px', color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="flex flex-wrap justify-center gap-3 mt-2 text-xs">
            {errorData.map((entry, idx) => (
              <div key={entry.name} className="flex items-center gap-1.5 text-slate-300">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                <span>{entry.name}: <strong className="text-white">{entry.count}</strong></span>
              </div>
            ))}
          </div>
        </div>

      </div>

      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-400" />
              Bank payout ledger
            </h3>
            <p className="text-xs text-slate-400">
              Matching Razorpay bulk NEFT settlement batch transfers against actual Bank statement deposits.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-700">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-slate-500 font-semibold border-b border-slate-700 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Payout Batch ID</th>
                <th className="py-3 px-4">Order Count</th>
                <th className="py-3 px-4">RP Expected Net Settlement</th>
                <th className="py-3 px-4">Actual Bank NEFT Credited</th>
                <th className="py-3 px-4">Variance / Discrepancy</th>
                <th className="py-3 px-4 text-right">Batch Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
              {summary.batch_summaries.map(batch => (
                <tr key={batch.payout_batch_id} className="hover:bg-slate-900/60 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-white">{batch.payout_batch_id}</td>
                  <td className="py-3 px-4 font-medium">{batch.order_count} transactions</td>
                  <td className="py-3 px-4 font-semibold text-slate-200">{formatCurrency(batch.expected_batch_settlement_inr)}</td>
                  <td className="py-3 px-4 font-semibold text-emerald-400">{formatCurrency(batch.bank_credited_inr)}</td>
                  <td className="py-3 px-4 font-mono">
                    {batch.discrepancy_inr > 0 ? (
                      <span className="text-rose-400 font-bold">+{formatCurrency(batch.discrepancy_inr)} Short</span>
                    ) : (
                      <span className="text-emerald-400">₹0.00 Exact</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {batch.status === 'MATCHED' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" /> Reconciled
                      </span>
                    )}
                    {batch.status === 'MISMATCHED' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <AlertTriangle className="w-3 h-3" /> Payout Mismatch
                      </span>
                    )}
                    {batch.status === 'MISSING_IN_BANK' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        <XCircle className="w-3 h-3" /> Uncredited Batch
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};
