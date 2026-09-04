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

import { LayoutGrid, ShieldAlert, BarChart2 } from 'lucide-react';
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
    <div className="min-h-screen bg-[#090d16] text-slate-100 pb-16 selection:bg-indigo-500 selection:text-white">
      
      <Header
        onRefresh={() => handleRunAudit(recordCount, injectErrors)}
        onOpenBankUpload={() => setIsBankUploadOpen(true)}
        isAuditing={isAuditing}
        recordCount={recordCount}
        injectedErrorCount={dataset.injected_errors_count}
      />

      <main className="max-w-7xl mx-auto px-6">
        
        <ExecutiveMetrics summary={summary} />

        <AuditRunnerControls
          onRunAudit={handleRunAudit}
          recordCount={recordCount}
          setRecordCount={setRecordCount}
          injectErrors={injectErrors}
          setInjectErrors={setInjectErrors}
          summary={summary}
          exceptions={exceptions}
        />

        <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab('GRID')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'GRID'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            3-Way Data Grid ({dataset.merchant_orders.length})
          </button>

          <button
            onClick={() => setActiveTab('EXCEPTIONS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'EXCEPTIONS'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            Isolated Exceptions ({exceptions.length})
          </button>

          <button
            onClick={() => setActiveTab('ANALYTICS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'ANALYTICS'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
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
