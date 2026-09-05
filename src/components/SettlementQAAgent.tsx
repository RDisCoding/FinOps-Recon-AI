import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
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
      text: `I have reviewed **${summary.total_orders_audited} records** and identified **₹${summary.total_leakage_recovered_inr.toLocaleString('en-IN')}** in potential recovery across ${summary.discrepancy_orders_count} exceptions.\n\nAsk about a payout, order, fee, GST calculation, or bank variance.`
    }
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [assistantStatus, setAssistantStatus] = useState<string | null>(null);
  const requestController = useRef<AbortController | null>(null);

  useEffect(() => () => requestController.current?.abort(), []);

  const handleSend = (textToSend?: string) => {
    if (isThinking) return;
    const query = textToSend || inputQuery;
    const trimmedQuery = query.trim().slice(0, 500);
    if (!trimmedQuery) return;

    requestController.current?.abort();
    const controller = new AbortController();
    requestController.current = controller;
    setAssistantStatus(null);

    const userMsg: AgentChatMessage = {
      id: `msg_${Date.now()}_user`,
      sender: 'user',
      text: trimmedQuery,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev.slice(-48), userMsg]);
    setIsThinking(true);
    void generateAgentResponse(trimmedQuery, summary, exceptions, controller.signal).then(result => {
      setMessages(prev => [...prev.slice(-48), result.message]);
      if (result.mode === 'rate_limited') setAssistantStatus('Rate limit protection active; local audit answer used.');
      if (result.mode === 'unavailable') setAssistantStatus('Groq unavailable; local audit answer used.');
    }).catch(error => {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setAssistantStatus('The request was interrupted; please try again.');
    }).finally(() => setIsThinking(false));
    setInputQuery('');
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
          className="fixed bottom-4 right-4 z-40 flex items-center gap-2 px-3 py-2 rounded-md bg-[#192331] text-slate-200 font-semibold text-xs shadow-lg shadow-black/20 hover:bg-slate-700 transition-all cursor-pointer border border-slate-600"
        >
          <Bot className="w-4 h-4" />
          <span>Recon Assistant</span>
          <span className="flex h-2 w-2 relative">
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-200"></span>
          </span>
        </button>
      )}

      {/* Slide-out Drawer Panel */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-[#111923] border-l border-slate-700 shadow-2xl flex flex-col animate-slide-left">
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-700 bg-[#151d28]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-400/30 flex items-center justify-center">
                <Bot className="w-5 h-5 text-blue-300" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-1.5">
                  Recon Assistant
                </h3>
                <p className="text-xs text-slate-400">Investigation support for this reconciliation batch</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Ready
              </span>
              <button
                onClick={onToggle}
                aria-label="Close Recon Assistant"
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Suggested Prompts Banner */}
          <div className="px-6 py-4 bg-[#151d28] border-b border-slate-700">
            <div className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider mb-3 flex items-center gap-1.5">
              <HelpCircle className="w-3 h-3 text-slate-500" />
              Suggested questions
            </div>
            <div className="grid grid-cols-1 gap-2">
              {SUGGESTED_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(prompt)}
                  disabled={isThinking}
                  className="text-left text-xs px-3 py-2 rounded-lg bg-slate-900/70 hover:bg-slate-800 border border-slate-700/60 text-slate-300 transition-all cursor-pointer truncate disabled:opacity-50"
                >
                  "{prompt}"
                </button>
              ))}
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 px-6 py-5 space-y-5 overflow-y-auto bg-[#101821]">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                    className={`max-w-[88%] px-4 py-3.5 rounded-2xl text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-[#192331] border border-slate-700 text-slate-200 rounded-bl-none'
                  }`}
                >
                  {msg.sender === 'agent' ? (
                    <div className="agent-markdown space-y-2">
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p>{children}</p>,
                          strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                          em: ({ children }) => <em className="text-slate-300">{children}</em>,
                          code: ({ children }) => <code className="rounded bg-slate-950 px-1 py-0.5 font-mono text-[11px] text-blue-200">{children}</code>,
                          ul: ({ children }) => <ul className="list-disc space-y-1 pl-4">{children}</ul>,
                          li: ({ children }) => <li>{children}</li>
                        }}
                      >
                        {msg.text}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">{msg.text}</div>
                  )}

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
          <div className="px-6 py-4 border-t border-slate-700 bg-[#151d28]">
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
                maxLength={500}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-400 transition-all disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={isThinking}
                aria-label="Send question"
                className="w-11 h-11 rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition-all cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            {isThinking && <p className="mt-2 text-[10px] text-cyan-400">Analyzing the current audit context...</p>}
            {assistantStatus && <p className="mt-2 text-[10px] text-amber-300">{assistantStatus}</p>}
          </div>

        </div>
      )}
    </>
  );
};
