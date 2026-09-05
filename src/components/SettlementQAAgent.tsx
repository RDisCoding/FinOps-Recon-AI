import React, { useState } from 'react';
import type { AuditSummary, ReconciliationException } from '../types/reconciliation';
import { generateAgentResponse } from '../services/aiAgentService';
import type { AgentChatMessage } from '../services/aiAgentService';
import { Bot, Send, X, HelpCircle, ChevronRight } from 'lucide-react';

interface SettlementQAAgentProps {
  summary: AuditSummary;
  exceptions: ReconciliationException[];
  onSelectException: (ex: ReconciliationException) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const SUGGESTED_PROMPTS = [
  "Why was my payout on Tuesday lower than expected?",
  "Which payment method had the highest rate of tax miscalculations?",
  "Explain Order ORD_10015 GST calculation error",
  "Summarize double refund deductions found in the audit"
];

export const SettlementQAAgent: React.FC<SettlementQAAgentProps> = ({
  summary,
  exceptions,
  onSelectException,
  isOpen,
  onToggle
}) => {
  const [messages, setMessages] = useState<AgentChatMessage[]>([
    {
      id: 'welcome',
      sender: 'agent',
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      text: `Hello! I am your **Autonomous Settlement Q&A Agent**. I have audited all **${summary.total_orders_audited} records** and identified **₹${summary.total_leakage_recovered_inr.toLocaleString('en-IN')}** in recoverable financial leakage across 25 discrepancies.\n\nAsk me any natural language question about your Razorpay settlements, GST tax deductions, MDR fee tiers, or missing bank deposits!`
    }
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  const handleSend = (textToSend?: string) => {
    const query = textToSend || inputQuery;
    if (!query.trim()) return;

    const userMsg: AgentChatMessage = {
      id: `msg_${Date.now()}_user`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setIsThinking(true);
    void generateAgentResponse(query, summary, exceptions).then(agentResp => {
      setMessages(prev => [...prev, agentResp]);
    }).finally(() => setIsThinking(false));
    if (!textToSend) setInputQuery('');
  };

  const handleAction = (msg: AgentChatMessage) => {
    if (msg.actionPayload?.type === 'OPEN_DISPUTE_MODAL' && msg.relatedExceptionId) {
      const targetEx = exceptions.find(ex => ex.id === msg.relatedExceptionId);
      if (targetEx) {
        onSelectException(targetEx);
      }
    }
  };

  return (
    <>
      {/* Floating Trigger Button (Bottom Right) */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-lg bg-blue-600 text-white font-semibold text-xs shadow-lg shadow-black/20 hover:bg-blue-500 transition-all cursor-pointer border border-blue-400/30"
        >
          <Bot className="w-4 h-4" />
          <span>Ask Recon Assistant</span>
          <span className="flex h-2 w-2 relative">
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-200"></span>
          </span>
        </button>
      )}

      {/* Slide-out Drawer Panel */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-[#111923] border-l border-slate-700 shadow-2xl flex flex-col animate-slide-left">
          
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700 bg-[#151d28]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-400/30 flex items-center justify-center">
                <Bot className="w-5 h-5 text-blue-300" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
                  Recon Assistant
                </h3>
                <p className="text-[11px] text-slate-400">Ask questions about your reconciliation data</p>
              </div>
            </div>

            <button
              onClick={onToggle}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Suggested Prompts Banner */}
          <div className="p-3 bg-[#151d28] border-b border-slate-700">
            <div className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider mb-2 flex items-center gap-1">
              <HelpCircle className="w-3 h-3 text-slate-500" />
              Suggested questions
            </div>
            <div className="flex flex-col gap-1.5">
              {SUGGESTED_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(prompt)}
                  className="text-left text-[11px] px-2.5 py-1.5 rounded-md bg-slate-900/70 hover:bg-slate-800 border border-slate-700/60 text-slate-300 transition-all cursor-pointer truncate"
                >
                  "{prompt}"
                </button>
              ))}
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 p-4 space-y-4 overflow-y-auto">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-[#192331] border border-slate-700 text-slate-200 rounded-bl-none'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.text}</div>

                  {/* Action Link Button */}
                  {msg.actionPayload && (
                    <button
                      onClick={() => handleAction(msg)}
                      className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition-all cursor-pointer"
                    >
                      Inspect Dispute Claim & Ticket
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <span className="text-[10px] text-slate-500 mt-1 px-1">{msg.timestamp}</span>
              </div>
            ))}
          </div>

          {/* Input Bar */}
          <div className="p-4 border-t border-slate-700 bg-[#151d28]">
            <form
              onSubmit={e => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Ask about UTRs, GST math, or payout drops..."
                value={inputQuery}
                onChange={e => setInputQuery(e.target.value)}
                disabled={isThinking}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-md px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-400 transition-all disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={isThinking}
                className="w-10 h-10 rounded-md bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            {isThinking && <p className="mt-2 text-[10px] text-cyan-400">Analyzing the current audit context...</p>}
          </div>

        </div>
      )}
    </>
  );
};
