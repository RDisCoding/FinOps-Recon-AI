import React, { useState } from 'react';
import type { ReconciliationException } from '../types/reconciliation';
import { generateDisputePDF, contestRazorpayDispute } from '../services/disputeActionService';
import type { EscalationStatus } from '../services/disputeActionService';
import { X, Copy, Check, ShieldAlert, IndianRupee, FileText, Download, Send, CheckCircle2 } from 'lucide-react';

interface DisputeModalProps {
  exception: ReconciliationException | null;
  onClose: () => void;
}

export const DisputeModal: React.FC<DisputeModalProps> = ({ exception, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [isEscalating, setIsEscalating] = useState(false);
  const [escalation, setEscalation] = useState<EscalationStatus | null>(null);
  const [disputeId, setDisputeId] = useState('');
  const [escalationError, setEscalationError] = useState<string | null>(null);

  if (!exception) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(exception.dispute_ticket_draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPDF = () => {
    generateDisputePDF(exception);
  };

  const handleSendWebhook = async () => {
    if (!disputeId.trim()) {
      setEscalationError('Enter the Razorpay dispute ID (disp_...) before contesting it.');
      return;
    }
    setIsEscalating(true);
    setEscalationError(null);
    try {
      const res = await contestRazorpayDispute(exception, disputeId.trim());
      setEscalation(res);
    } catch (error) {
      setEscalationError(error instanceof Error ? error.message : 'Unable to reach Razorpay.');
    } finally {
      setIsEscalating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="glass-panel w-full max-w-2xl rounded-2xl border border-slate-700/80 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">{exception.title}</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {exception.error_type}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">Order ID: {exception.order_id} • Batch: {exception.payout_batch_id || 'N/A'}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          
          {/* Financial Loss Highlight */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-rose-950/40 via-amber-950/20 to-slate-900 border border-rose-500/30 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-rose-400 uppercase tracking-wider">Identified Financial Leakage</div>
              <div className="text-xs text-slate-300 mt-0.5">{exception.description}</div>
            </div>
            <div className="text-2xl font-black text-rose-400 flex items-center shrink-0 ml-4">
              <IndianRupee className="w-5 h-5" />
              {exception.financial_leakage.toFixed(2)}
            </div>
          </div>

          {/* Audit Verification Proof */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400 font-semibold block mb-1">Contract Agreed Standard:</span>
              <span className="font-mono text-emerald-400 font-bold text-sm">{exception.expected_value}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400 font-semibold block mb-1">Gateway Logged Value:</span>
              <span className="font-mono text-rose-400 font-bold text-sm">{exception.actual_value}</span>
            </div>
          </div>

          {/* Live Webhook Escalation Status Box */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <label className="text-xs font-semibold text-slate-300 block" htmlFor="razorpay-dispute-id">
              Razorpay dispute ID
            </label>
            <input
              id="razorpay-dispute-id"
              value={disputeId}
              onChange={event => setDisputeId(event.target.value)}
              placeholder="disp_AHfqOvkldwsbqt"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
            />
            <p className="text-[10px] text-slate-500">This contests an existing Razorpay dispute in draft mode through the secure server adapter.</p>
          </div>

          {escalationError && <p className="text-xs text-rose-300 bg-rose-950/30 border border-rose-500/30 rounded-lg p-3">{escalationError}</p>}

          {escalation && (
            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Razorpay Dispute Contest Submitted
                </span>
                <span className="font-mono text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">
                  {escalation.ticketId}
                </span>
              </div>
              <p className="text-slate-300">Status: <strong className="text-emerald-400">{escalation.status}</strong></p>
              <pre className="p-2 rounded bg-slate-950 text-[10px] text-slate-400 font-mono overflow-x-auto">
                {escalation.webhookResponse}
              </pre>
            </div>
          )}

          {/* Auto Dispute Ticket Text Box */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-400" />
                Razorpay Support Ticket Draft (Auto-Generated)
              </span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/30 transition-all cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied' : 'Copy Text'}
              </button>
            </div>

            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed">
              {exception.dispute_ticket_draft}
            </pre>
          </div>

          {/* Action Buttons Grid */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={handleDownloadPDF}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              Download Dispute Packet (PDF)
            </button>

            <button
              onClick={handleSendWebhook}
              disabled={isEscalating || !!escalation}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition-all cursor-pointer disabled:opacity-50"
            >
              <Send className={`w-4 h-4 ${isEscalating ? 'animate-spin' : ''}`} />
              {isEscalating ? 'Contesting Dispute...' : escalation ? 'Dispute Contest Sent' : 'Contest Razorpay Dispute'}
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs">
          <span className="text-slate-400">Timestamp: {new Date(exception.timestamp).toLocaleString()}</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-all cursor-pointer"
          >
            Close Window
          </button>
        </div>

      </div>
    </div>
  );
};
