import React, { useState } from 'react';
import type { MerchantOrder, RazorpaySettlementLog, ErrorType, ReconciliationException } from '../types/reconciliation';
import { Search, Filter, AlertCircle, CheckCircle2, ChevronRight, FileText } from 'lucide-react';

interface ReconciliationDataGridProps {
  orders: MerchantOrder[];
  logs: RazorpaySettlementLog[];
  orderStatusMap: Map<string, { status: 'MATCHED' | 'DISCREPANCY'; errors: ErrorType[] }>;
  exceptions: ReconciliationException[];
  onSelectException: (ex: ReconciliationException) => void;
}

export const ReconciliationDataGrid: React.FC<ReconciliationDataGridProps> = ({
  orders,
  logs,
  orderStatusMap,
  exceptions,
  onSelectException
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');

  const logMap = new Map<string, RazorpaySettlementLog>();
  logs.forEach(l => logMap.set(l.order_id, l));

  const exceptionMap = new Map<string, ReconciliationException>();
  exceptions.forEach(ex => exceptionMap.set(ex.order_id, ex));

  const filteredOrders = orders.filter(ord => {
    const statusInfo = orderStatusMap.get(ord.order_id);
    const log = logMap.get(ord.order_id);

    const matchesSearch = 
      ord.order_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log?.payout_batch_id || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterType === 'ALL') return true;
    if (filterType === 'MATCHED') return statusInfo?.status === 'MATCHED';
    if (filterType === 'DISCREPANCIES') return statusInfo?.status === 'DISCREPANCY';
    
    return statusInfo?.errors.includes(filterType as ErrorType);
  });

  const getErrorBadge = (type: ErrorType) => {
    switch (type) {
      case 'MDR_OVERCHARGE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">MDR Overcharge</span>;
      case 'GST_MISCALCULATION':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">18% GST Error</span>;
      case 'GHOST_PAYOUT':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">Ghost Payout</span>;
      case 'DOUBLE_REFUND':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30">Double Refund</span>;
      case 'PROMO_MISALLOCATION':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">Promo Misallocated</span>;
    }
  };

  return (
    <div className="glass-card rounded-2xl p-6 mb-6">
      
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            3-Way Financial Triangulation Data Grid
          </h2>
          <p className="text-xs text-slate-400">
            Real-time line item comparison across Merchant DB, Razorpay API Logs, and Bank Payouts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Order ID, Customer..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-indigo-400" />
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer text-xs"
            >
              <option value="ALL" className="bg-slate-900">All Records ({orders.length})</option>
              <option value="DISCREPANCIES" className="bg-slate-900 text-rose-400">All Discrepancies ({exceptions.length})</option>
              <option value="MATCHED" className="bg-slate-900 text-emerald-400">Matched Clean ({orders.length - exceptions.length})</option>
              <option value="MDR_OVERCHARGE" className="bg-slate-900">MDR Overcharge</option>
              <option value="GST_MISCALCULATION" className="bg-slate-900">18% GST Miscalculation</option>
              <option value="GHOST_PAYOUT" className="bg-slate-900">Ghost Payout</option>
              <option value="DOUBLE_REFUND" className="bg-slate-900">Double Refund</option>
              <option value="PROMO_MISALLOCATION" className="bg-slate-900">Promo Misallocation</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3 px-4">Status & Order ID</th>
              <th className="py-3 px-4">Customer & Method</th>
              <th className="py-3 px-4">1. Merchant DB Value</th>
              <th className="py-3 px-4">2. Razorpay Log Fee & GST</th>
              <th className="py-3 px-4">3. Net Settlement</th>
              <th className="py-3 px-4">Bank Batch UTR</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
            {filteredOrders.slice(0, 100).map(ord => {
              const log = logMap.get(ord.order_id);
              const statusInfo = orderStatusMap.get(ord.order_id);
              const exception = exceptionMap.get(ord.order_id);
              const isDiscrepancy = statusInfo?.status === 'DISCREPANCY';

              return (
                <tr
                  key={ord.order_id}
                  className={`hover:bg-slate-900/60 transition-colors ${
                    isDiscrepancy ? 'bg-rose-950/10' : ''
                  }`}
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {isDiscrepancy ? (
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                      <div>
                        <div className="font-mono font-bold text-white">{ord.order_id}</div>
                        <div className="flex items-center gap-1 mt-0.5">
                          {statusInfo?.errors.map(err => (
                            <React.Fragment key={err}>{getErrorBadge(err)}</React.Fragment>
                          ))}
                          {!isDiscrepancy && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Matched 100%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="font-medium text-slate-200">{ord.customer_name}</div>
                    <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                      <span>{ord.payment_method}</span>
                      {ord.promo_code && (
                        <span className="text-indigo-400 font-semibold">• {ord.promo_code}</span>
                      )}
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-100">₹{ord.gross_amount.toFixed(2)}</div>
                    <div className="text-[11px] text-slate-400">
                      Agreed MDR: <span className="text-slate-200">{(ord.agreed_mdr_rate * 100).toFixed(1)}%</span>
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    {log ? (
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-300">MDR: ₹{log.mdr_fee_amount.toFixed(2)}</span>
                          <span className="text-slate-500">({(log.mdr_fee_rate_charged * 100).toFixed(1)}%)</span>
                        </div>
                        <div className={`text-[11px] ${log.injected_error_type === 'GST_MISCALCULATION' ? 'text-rose-400 font-bold' : 'text-slate-400'}`}>
                          GST: ₹{log.gst_amount.toFixed(2)}
                        </div>
                      </div>
                    ) : (
                      <span className="text-rose-400 italic">No Log Record</span>
                    )}
                  </td>

                  <td className="py-3 px-4">
                    {log ? (
                      <div>
                        <div className="font-bold text-emerald-400">₹{log.net_settlement_amount.toFixed(2)}</div>
                        {log.deducted_promo_amount > 0 && (
                          <div className="text-[10px] text-cyan-400">Promo Ded: ₹{log.deducted_promo_amount}</div>
                        )}
                        {log.refund_deduction > 0 && (
                          <div className="text-[10px] text-red-400 font-bold">Refund Ded: ₹{log.refund_deduction}</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-500">-</span>
                    )}
                  </td>

                  <td className="py-3 px-4 font-mono text-[11px]">
                    {log ? (
                      <div>
                        <div className="text-slate-300 font-medium">{log.payout_batch_id}</div>
                        {log.injected_error_type === 'GHOST_PAYOUT' ? (
                          <span className="text-rose-400 font-bold">Missing Bank Credit!</span>
                        ) : (
                          <span className="text-emerald-400/80">Bank Verified</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-500">Uncredited</span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-right">
                    {exception ? (
                      <button
                        onClick={() => onSelectException(exception)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition-all cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Dispute Claim
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    ) : (
                      <span className="text-slate-600 text-xs">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredOrders.length > 100 && (
        <div className="text-center mt-4 text-xs text-slate-400">
          Showing first 100 records of {filteredOrders.length} matching rows.
        </div>
      )}

    </div>
  );
};
