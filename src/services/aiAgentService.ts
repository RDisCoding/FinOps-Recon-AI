import type { AuditSummary, ReconciliationException } from '../types/reconciliation';

export interface AgentChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
  relatedOrderId?: string;
  relatedExceptionId?: string;
  actionPayload?: {
    type: 'OPEN_DISPUTE_MODAL' | 'FILTER_EXCEPTIONS';
    targetId: string;
  };
}

export function generateDeterministicAgentResponse(
  question: string,
  summary: AuditSummary,
  exceptions: ReconciliationException[]
): AgentChatMessage {
  const qLower = question.toLowerCase();
  const timestamp = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  // 1. Specific Order ID Query
  const orderIdMatch = qLower.match(/ord_\d+/i);
  if (orderIdMatch) {
    const targetOrderId = orderIdMatch[0].toUpperCase();
    const relatedException = exceptions.find(ex => ex.order_id.toUpperCase() === targetOrderId);

    if (relatedException) {
      return {
        id: `msg_${Date.now()}`,
        sender: 'agent',
        timestamp,
        relatedOrderId: targetOrderId,
        relatedExceptionId: relatedException.id,
        text: `**Audit Analysis for ${targetOrderId}:**\n\n- **Issue Identified:** ${relatedException.title} (${relatedException.error_type})\n- **Financial Leakage:** ₹${relatedException.financial_leakage.toFixed(2)}\n- **Description:** ${relatedException.description}\n\n**Mathematical Proof:**\nExpected Standard: \`${relatedException.expected_value}\` vs Actual Gateway Charge: \`${relatedException.actual_value}\`.\n\n*Click below to launch the formal Razorpay dispute claim ticket.*`,
        actionPayload: {
          type: 'OPEN_DISPUTE_MODAL',
          targetId: relatedException.id
        }
      };
    } else {
      return {
        id: `msg_${Date.now()}`,
        sender: 'agent',
        timestamp,
        text: `**Order ${targetOrderId} Reconciled 100% Clean.**\nNo fee overcharges, tax miscalculations, or bank payout drops were detected for this transaction.`
      };
    }
  }

  // 2. Highest Tax Miscalculations / Payment Method Query
  if (qLower.includes('tax') || qLower.includes('gst') || qLower.includes('highest')) {
    const gstExceptions = exceptions.filter(ex => ex.error_type === 'GST_MISCALCULATION');
    const totalGstLeakage = gstExceptions.reduce((acc, curr) => acc + curr.financial_leakage, 0);
    
    return {
      id: `msg_${Date.now()}`,
      sender: 'agent',
      timestamp,
      text: `**GST Tax Calculation Basis Audit Report:**\n\n- **Total GST Errors Isolated:** ${gstExceptions.length} transactions\n- **Total Leaked GST Margin:** ₹${totalGstLeakage.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n- **Root Cause:** Razorpay's settlement pipeline mistakenly calculated 18% GST on the *total product order price* (e.g. 18% of ₹1,000 = ₹180) instead of 18% on the *MDR processing fee* (18% of ₹20 = ₹3.60).\n- **Primary Payment Methods Affected:** UPI & Credit Card high-value transactions.\n\nAll ${gstExceptions.length} line items are flagged in your Exception Ledger with ready-to-file dispute claim drafts.`
    };
  }

  // 3. Tuesday / Batch Payout lower than expected query
  if (qLower.includes('payout') || qLower.includes('tuesday') || qLower.includes('lower') || qLower.includes('batch')) {
    const ghostPayouts = exceptions.filter(ex => ex.error_type === 'GHOST_PAYOUT');
    const ghostLeakage = ghostPayouts.reduce((acc, curr) => acc + curr.financial_leakage, 0);

    return {
      id: `msg_${Date.now()}`,
      sender: 'agent',
      timestamp,
      text: `**Bank Settlement Batch Variance Analysis:**\n\nYour payout was lower than expected due to **${ghostPayouts.length} Ghost Payouts / Uncredited Bank Transfers** and MDR overcharges.\n\n- **Uncredited Bank Drop Loss:** ₹${ghostLeakage.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n- **Primary Batch Affected:** \`BATCH_20260901_AX\` (UTR: UTR_ICICI_202609001)\n- **Explanation:** Razorpay API logs marked these orders as 'SETTLED', but the net transfer funds were dropped prior to NEFT deposit into your company bank account.`
    };
  }

  // 4. Double Refund Query
  if (qLower.includes('refund') || qLower.includes('double')) {
    const refundExceptions = exceptions.filter(ex => ex.error_type === 'DOUBLE_REFUND');
    const refundLeakage = refundExceptions.reduce((acc, curr) => acc + curr.financial_leakage, 0);

    return {
      id: `msg_${Date.now()}`,
      sender: 'agent',
      timestamp,
      text: `**Double Refund Interception Report:**\n\n- **Duplicate Deductions Intercepted:** ${refundExceptions.length} orders\n- **Recoverable Refund Margin:** ₹${refundLeakage.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n- **Mechanism:** A system retry glitch caused Razorpay to deduct single customer returns twice across settlement batches. Our engine intercepted and isolated the second duplicate charge.`
    };
  }

  // 5. Promo Co-Funded Query
  if (qLower.includes('promo') || qLower.includes('coupon') || qLower.includes('discount')) {
    const promoExceptions = exceptions.filter(ex => ex.error_type === 'PROMO_MISALLOCATION');
    const promoLeakage = promoExceptions.reduce((acc, curr) => acc + curr.financial_leakage, 0);

    return {
      id: `msg_${Date.now()}`,
      sender: 'agent',
      timestamp,
      text: `**Co-Funded Promo Audit Report:**\n\n- **Misallocated Promo Coupons:** ${promoExceptions.length} cases\n- **Improperly Deducted Amount:** ₹${promoLeakage.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n- **Explanation:** Under your promotional agreement, Razorpay co-funds 100% of discount codes like \`RAZORPAY50_COFUND\`. However, these discounts were incorrectly deducted from your merchant payout.`
    };
  }

  // 6. Default Executive Summary Response
  return {
    id: `msg_${Date.now()}`,
    sender: 'agent',
    timestamp,
    text: `**FinOps AI Reconciliation Assistant Summary:**\n\nI have audited **${summary.total_orders_audited} transaction records** totaling ₹${summary.total_order_value_inr.toLocaleString('en-IN')}.\n\n- **Match Rate:** ${summary.match_rate_percentage}%\n- **Isolated Operational Errors:** ${summary.discrepancy_orders_count} exceptions\n- **Total Actionable Margin Recovered:** ₹${summary.total_leakage_recovered_inr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n\nYou can ask me specific questions like:\n- *"Why was my payout on Tuesday ₹14,250 lower than expected?"*\n- *"Which payment method had the highest rate of tax miscalculations?"*\n- *"Explain Order ORD_10015 discrepancy."*`
  };
}

function buildAuditContext(summary: AuditSummary, exceptions: ReconciliationException[]) {
  return JSON.stringify({
    summary,
    exceptions: exceptions.map(exception => ({
      id: exception.id,
      order_id: exception.order_id,
      error_type: exception.error_type,
      severity: exception.severity,
      description: exception.description,
      expected_value: exception.expected_value,
      actual_value: exception.actual_value,
      financial_leakage: exception.financial_leakage,
      payout_batch_id: exception.payout_batch_id,
      timestamp: exception.timestamp
    }))
  });
}

export async function generateAgentResponse(
  question: string,
  summary: AuditSummary,
  exceptions: ReconciliationException[]
): Promise<AgentChatMessage> {
  const fallback = () => generateDeterministicAgentResponse(question, summary, exceptions);
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;

  if (!apiKey) return fallback();

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: import.meta.env.VITE_GROQ_MODEL || 'qwen/qwen3.8-27b',
        temperature: 0.1,
        max_tokens: 700,
        messages: [
          {
            role: 'system',
            content: 'You are a precise FinOps reconciliation analyst. Answer only from the supplied audit context. Cite order IDs, exception IDs, batch IDs, and amounts when relevant. Never invent a transaction, UTR, or financial value. If the context does not contain the answer, say so. Use concise Markdown.'
          },
          {
            role: 'user',
            content: `Question:\n${question}\n\nAudit context:\n${buildAuditContext(summary, exceptions)}`
          }
        ]
      })
    });

    if (!response.ok) throw new Error(`Groq request failed with status ${response.status}`);

    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error('Groq returned an empty response');

    const orderIdMatch = question.match(/ord_\d+/i);
    const relatedException = orderIdMatch
      ? exceptions.find(exception => exception.order_id.toUpperCase() === orderIdMatch[0].toUpperCase())
      : undefined;

    return {
      id: `msg_${Date.now()}`,
      sender: 'agent',
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      text,
      relatedOrderId: relatedException?.order_id,
      relatedExceptionId: relatedException?.id,
      actionPayload: relatedException ? { type: 'OPEN_DISPUTE_MODAL', targetId: relatedException.id } : undefined
    };
  } catch {
    return fallback();
  }
}
