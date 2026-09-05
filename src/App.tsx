import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ExecutiveMetrics } from './components/ExecutiveMetrics';
import { AuditRunnerControls } from './components/AuditRunnerControls';
import { ReconciliationDataGrid } from './components/ReconciliationDataGrid';
import { ExceptionLedger } from './components/ExceptionLedger';
import { AnalyticsView } from './components/AnalyticsView';
import { DisputeModal } from './components/DisputeModal';
import { SettlementQAAgent } from './components/SettlementQAAgent';
import { BankUploadModal } from './components/BankUploadModal';

import { generateSyntheticDataset } from './services/syntheticDataGenerator';
import { runReconciliationAudit } from './services/auditEngine';
import type { SyntheticDataset, AuditSummary, ReconciliationException, ErrorType, BankStatementCredit } from './types/reconciliation';

import { LayoutGrid, ShieldAlert, BarChart2, ArrowRight, CheckCircle2, AlertTriangle, Landmark } from 'lucide-react';
import confetti from 'canvas-confetti';

export function App() {
  const [recordCount, setRecordCount] = useState<number>(500);
  const [injectErrors, setInjectErrors] = useState<boolean>(true);
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'GRID' | 'EXCEPTIONS' | 'ANALYTICS'>('GRID');

  const [dataset, setDataset] = useState<SyntheticDataset | null>(null);
  const [summary, setSummary] = useState<AuditSummary | null>(null);
  const [exceptions, setExceptions] = useState<ReconciliationException[]>([]);
  const [orderStatusMap, setOrderStatusMap] = useState<Map<string, { status: 'MATCHED' | 'DISCREPANCY'; errors: ErrorType[] }>>(new Map());

  const [selectedException, setSelectedException] = useState<ReconciliationException | null>(null);
  const [isQAAgentOpen, setIsQAAgentOpen] = useState<boolean>(false);
  const [isBankUploadOpen, setIsBankUploadOpen] = useState<boolean>(false);

  useEffect(() => {
    handleRunAudit(500, true);
  }, []);

  const handleRunAudit = (count: number, inject: boolean) => {
    setIsAuditing(true);
    
    setTimeout(() => {
      const freshData = generateSyntheticDataset(count, inject, 25);
      const result = runReconciliationAudit(freshData);

      setDataset(freshData);
      setSummary(result.summary);
      setExceptions(result.exceptions);
      setOrderStatusMap(result.orderStatusMap);
      setIsAuditing(false);

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 }
      });
    }, 400);
  };

  const handleApplyParsedBankCredits = (newBankCredits: BankStatementCredit[]) => {
    if (!dataset) return;
    setIsAuditing(true);

    setTimeout(() => {
      const updatedDataset: SyntheticDataset = {
        ...dataset,
        bank_credits: newBankCredits
      };

      const result = runReconciliationAudit(updatedDataset);
      setDataset(updatedDataset);
      setSummary(result.summary);
      setExceptions(result.exceptions);
      setOrderStatusMap(result.orderStatusMap);
      setIsAuditing(false);
    }, 300);
  };

  if (!summary || !dataset) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin mx-auto" />
          <p className="text-sm font-medium text-slate-400">Initializing FinOps Recon Audit Engine...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b1018] text-slate-100 pb-16 selection:bg-blue-500 selection:text-white">
      
      <Header
        onRefresh={() => handleRunAudit(recordCount, injectErrors)}
        onOpenBankUpload={() => setIsBankUploadOpen(true)}
        isAuditing={isAuditing}
        recordCount={recordCount}
        injectedErrorCount={dataset.injected_errors_count}
      />

      <main className="max-w-7xl mx-auto px-6">
        <section className="mb-7">
          <p className="eyebrow mb-2">Reconciliation Overview</p>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-white">Control your settlement health</h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-400">Monitor transaction matching, settlement discrepancies, and financial leakage across merchant, Razorpay, and bank records.</p>
            </div>
            <div className="text-left md:text-right">
              <p className="eyebrow">Last audit</p>
              <p className="mt-1 text-sm text-slate-300">{new Date(summary.audit_timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} · {summary.execution_time_ms} ms</p>
            </div>
          </div>
        </section>
        
        <ExecutiveMetrics summary={summary} />

        <section className="glass-card rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="eyebrow">Reconciliation Health</p>
              <h2 className="section-title mt-1">Three sources, one settlement view</h2>
            </div>
            <span className="text-xs text-slate-400">{summary.matched_orders_count} matched · {summary.discrepancy_orders_count} exceptions</span>
          </div>
          <div className="health-track grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative flex items-center gap-3 bg-[#151d28] md:bg-transparent rounded-lg p-3 md:p-0">
              <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center"><Landmark className="w-4 h-4 text-slate-300" /></div>
              <div><p className="text-sm font-semibold text-slate-200">Merchant records</p><p className="text-xs text-slate-500">{summary.total_orders_audited} orders loaded</p></div>
              <ArrowRight className="hidden md:block absolute -right-3 w-4 h-4 text-slate-600" />
            </div>
            <div className="relative flex items-center gap-3 bg-[#151d28] md:bg-transparent rounded-lg p-3 md:p-0">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-400/30 flex items-center justify-center"><CheckCircle2 className="w-4 h-4 text-blue-300" /></div>
              <div><p className="text-sm font-semibold text-slate-200">Razorpay settlement</p><p className="text-xs text-slate-500">{summary.total_settled_value_inr.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })} logged</p></div>
              <ArrowRight className="hidden md:block absolute -right-3 w-4 h-4 text-slate-600" />
            </div>
            <div className="flex items-center gap-3 bg-[#151d28] md:bg-transparent rounded-lg p-3 md:p-0">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${summary.discrepancy_orders_count ? 'bg-amber-500/10 border-amber-400/30' : 'bg-emerald-500/10 border-emerald-400/30'}`}><AlertTriangle className={`w-4 h-4 ${summary.discrepancy_orders_count ? 'text-amber-300' : 'text-emerald-300'}`} /></div>
              <div><p className="text-sm font-semibold text-slate-200">Bank payout</p><p className="text-xs text-slate-500">{summary.total_bank_credited_inr.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })} credited</p></div>
            </div>
          </div>
        </section>

        <AuditRunnerControls
          onRunAudit={handleRunAudit}
          recordCount={recordCount}
          setRecordCount={setRecordCount}
          injectErrors={injectErrors}
          setInjectErrors={setInjectErrors}
          summary={summary}
          exceptions={exceptions}
        />

        <div className="flex flex-wrap items-center gap-1 mb-6 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab('GRID')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'GRID'
                ? 'bg-slate-700 text-white'
                : 'text-slate-500 hover:text-slate-200'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            3-Way Data Grid ({dataset.merchant_orders.length})
          </button>

          <button
            onClick={() => setActiveTab('EXCEPTIONS')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'EXCEPTIONS'
                ? 'bg-slate-700 text-white'
                : 'text-slate-500 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            Isolated Exceptions ({exceptions.length})
          </button>

          <button
            onClick={() => setActiveTab('ANALYTICS')}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'ANALYTICS'
                ? 'bg-slate-700 text-white'
                : 'text-slate-500 hover:text-slate-200'
            }`}
          >
            <BarChart2 className="w-4 h-4 text-cyan-400" />
            Financial Leakage Analytics & Bank Ledger
          </button>
        </div>

        {activeTab === 'GRID' && (
          <ReconciliationDataGrid
            orders={dataset.merchant_orders}
            logs={dataset.razorpay_logs}
            orderStatusMap={orderStatusMap}
            exceptions={exceptions}
            onSelectException={(ex) => setSelectedException(ex)}
          />
        )}

        {activeTab === 'EXCEPTIONS' && (
          <ExceptionLedger
            exceptions={exceptions}
            onSelectException={(ex) => setSelectedException(ex)}
          />
        )}

        {activeTab === 'ANALYTICS' && (
          <AnalyticsView summary={summary} />
        )}

      </main>

      {/* Settlement Q&A Agent Sidebar */}
      <SettlementQAAgent
        summary={summary}
        exceptions={exceptions}
        onSelectException={(ex) => setSelectedException(ex)}
        isOpen={isQAAgentOpen}
        onToggle={() => setIsQAAgentOpen(prev => !prev)}
      />

      {/* Unstructured Bank Upload Modal */}
      <BankUploadModal
        isOpen={isBankUploadOpen}
        onClose={() => setIsBankUploadOpen(false)}
        onApplyParsedBankCredits={handleApplyParsedBankCredits}
      />

      {/* Dispute Claim Action Modal */}
      <DisputeModal
        exception={selectedException}
        onClose={() => setSelectedException(null)}
      />

    </div>
  );
}

export default App;
