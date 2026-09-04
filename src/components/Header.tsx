import React from 'react';
import { ShieldCheck, Cpu, RefreshCw, Zap, Award, FileSpreadsheet } from 'lucide-react';

interface HeaderProps {
  onRefresh: () => void;
  onOpenBankUpload: () => void;
  isAuditing: boolean;
  recordCount: number;
  injectedErrorCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onRefresh,
  onOpenBankUpload,
  isAuditing,
  recordCount,
  injectedErrorCount
}) => {
  return (
    <header className="sticky top-0 z-30 glass-panel border-b border-slate-800/80 px-6 py-4 mb-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Left Branding */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                FinOps Recon AI
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Award className="w-3 h-3 text-amber-400" />
                Track 04: AI Finance Controller
              </span>
            </div>
            <p className="text-xs text-slate-400">
              3-Way Settlement Auditor & Financial Leakage Recovery Engine • Razorpay Buildathon
            </p>
          </div>
        </div>

        {/* Center Live Badges */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>Batch Engine: <strong className="text-white">{recordCount} Records</strong></span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Injected Errors: <strong className="text-amber-400">{injectedErrorCount} Cases</strong></span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenBankUpload}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium text-xs bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Parse Messy Bank CSV
          </button>

          <button
            onClick={onRefresh}
            disabled={isAuditing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-xs bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/30 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin' : ''}`} />
            {isAuditing ? 'Auditing Batch...' : 'Run 3-Way Reconciliation'}
          </button>
        </div>

      </div>
    </header>
  );
};
