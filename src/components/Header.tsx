import React from 'react';
import { ShieldCheck, Cpu, RefreshCw, Zap, FileSpreadsheet } from 'lucide-react';

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
    <header className="sticky top-0 z-30 glass-panel border-b surface-divider px-6 py-3 mb-8">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-4">
        
        {/* Left Branding */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-400/30 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-blue-300" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-[#101721]">
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white">FinOps Recon</h1>
            </div>
            <p className="text-xs text-slate-400">Financial Reconciliation · Track 04 AI Finance Controller</p>
          </div>
        </div>

        {/* Center Live Badges */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-900/60 border border-slate-700/70 text-xs text-slate-400">
            <Cpu className="w-3.5 h-3.5 text-slate-500" />
            <span>Dataset <strong className="text-slate-200">{recordCount} records</strong></span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-900/60 border border-slate-700/70 text-xs text-slate-400">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Scenario <strong className="text-amber-300">{injectedErrorCount} exceptions</strong></span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenBankUpload}
            className="flex items-center gap-1.5 px-3 py-2 rounded-md font-semibold text-xs bg-transparent hover:bg-slate-800 text-slate-300 border border-slate-700 transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Parse Messy Bank CSV
          </button>

          <button
            onClick={onRefresh}
            disabled={isAuditing}
            className="flex items-center gap-2 px-4 py-2 rounded-md font-semibold text-xs bg-blue-600 hover:bg-blue-500 text-white transition-all disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin' : ''}`} />
            {isAuditing ? 'Auditing Batch...' : 'Run 3-Way Reconciliation'}
          </button>
        </div>

      </div>
    </header>
  );
};
