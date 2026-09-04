import React, { useState } from 'react';
import { parseUnstructuredBankStatement, SAMPLE_RAW_BANK_STATEMENT } from '../services/bankStatementParser';
import type { ParsedBankLine } from '../services/bankStatementParser';
import type { BankStatementCredit } from '../types/reconciliation';
import { X, CheckCircle2, FileSpreadsheet, Sparkles, ArrowRight } from 'lucide-react';

interface BankUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyParsedBankCredits: (credits: BankStatementCredit[]) => void;
}

export const BankUploadModal: React.FC<BankUploadModalProps> = ({
  isOpen,
  onClose,
  onApplyParsedBankCredits
}) => {
  const [rawText, setRawText] = useState<string>(SAMPLE_RAW_BANK_STATEMENT);
  const [parsedResults, setParsedResults] = useState<{ parsedLines: ParsedBankLine[]; bankCredits: BankStatementCredit[] } | null>(null);

  if (!isOpen) return null;

  const handleParse = () => {
    const results = parseUnstructuredBankStatement(rawText);
    setParsedResults(results);
  };

  const handleApply = () => {
    if (parsedResults) {
      onApplyParsedBankCredits(parsedResults.bankCredits);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="glass-panel w-full max-w-3xl rounded-2xl border border-slate-700 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                Unstructured Bank Statement Ingestion
                <Sparkles className="w-4 h-4 text-amber-400" />
              </h3>
              <p className="text-xs text-slate-400">Parse messy CSVs or raw bank narration strings with AI fuzzy extraction</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          
          {/* Raw Input Text Area */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300">
                Paste Messy Bank Narration CSV / String:
              </label>
              <button
                onClick={() => setRawText(SAMPLE_RAW_BANK_STATEMENT)}
                className="text-[11px] text-cyan-400 hover:underline cursor-pointer font-medium"
              >
                Load Sample Bank Statement
              </button>
            </div>
            <textarea
              rows={4}
              value={rawText}
              onChange={e => setRawText(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500 transition-all"
              placeholder="Paste raw bank statement narration text here..."
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleParse}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/20 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              Run Fuzzy AI Ingestion Parser
            </button>
          </div>

          {/* Parsed Extracted Results Table */}
          {parsedResults && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Structured Extracted Payload ({parsedResults.parsedLines.length} Records)
              </h4>

              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Raw Bank Narration</th>
                      <th className="py-2.5 px-3">Extracted UTR</th>
                      <th className="py-2.5 px-3">Amount (₹)</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3 text-right">Confidence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-950">
                    {parsedResults.parsedLines.map((line, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/50">
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400 truncate max-w-xs">{line.raw_line}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-cyan-400">{line.bank_utr}</td>
                        <td className="py-2.5 px-3 font-semibold text-emerald-400">₹{line.amount.toLocaleString('en-IN')}</td>
                        <td className="py-2.5 px-3 text-slate-300">{line.date}</td>
                        <td className="py-2.5 px-3 text-right">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {(line.confidence_score * 100).toFixed(0)}% Match
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs">
          <span className="text-slate-400">Normalizes unstructured CSVs for 3-Way Triangulation</span>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={!parsedResults}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
            >
              Apply to 3-Way Audit Engine
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
