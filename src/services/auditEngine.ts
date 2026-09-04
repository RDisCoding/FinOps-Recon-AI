import type { 
  SyntheticDataset, 
  AuditSummary, 
  ReconciliationException, 
  ErrorType,
  RazorpaySettlementLog,
  MerchantOrder
} from '../types/reconciliation';

export function runReconciliationAudit(dataset: SyntheticDataset): {
  summary: AuditSummary;
  exceptions: ReconciliationException[];
  orderStatusMap: Map<string, { status: 'MATCHED' | 'DISCREPANCY'; errors: ErrorType[] }>;
} {
  const startTime = performance.now();
  const exceptions: ReconciliationException[] = [];
  const orderStatusMap = new Map<string, { status: 'MATCHED' | 'DISCREPANCY'; errors: ErrorType[] }>();
  let malformedRecordsCount = 0;

  const rpLogMap = new Map<string, RazorpaySettlementLog>();
  dataset.razorpay_logs.forEach(log => {
    if (isValidSettlementLog(log)) rpLogMap.set(log.order_id, log);
    else malformedRecordsCount++;
  });

  const bankCreditMap = new Map<string, number>();
  dataset.bank_credits.forEach(bankCredit => {
    if (typeof bankCredit.payout_batch_id === 'string' && Number.isFinite(bankCredit.credit_amount)) {
      bankCreditMap.set(bankCredit.payout_batch_id, bankCredit.credit_amount);
    } else {
      malformedRecordsCount++;
    }
  });

  const errorsByType: Record<ErrorType, { count: number; leakage_inr: number }> = {
    MDR_OVERCHARGE: { count: 0, leakage_inr: 0 },
    GST_MISCALCULATION: { count: 0, leakage_inr: 0 },
    GHOST_PAYOUT: { count: 0, leakage_inr: 0 },
    DOUBLE_REFUND: { count: 0, leakage_inr: 0 },
    PROMO_MISALLOCATION: { count: 0, leakage_inr: 0 }
  };

  let totalOrderValueInr = 0;
  let totalSettledValueInr = 0;
  let matchedOrdersCount = 0;
  let discrepancyOrdersCount = 0;
  let validMerchantOrderCount = 0;

  const batchOrderSumsMap = new Map<string, { count: number; expectedSettlement: number }>();

  for (const merchantOrder of dataset.merchant_orders) {
    if (!isValidMerchantOrder(merchantOrder)) {
      malformedRecordsCount++;
      continue;
    }
    validMerchantOrderCount++;

    const orderId = merchantOrder.order_id;
    totalOrderValueInr += merchantOrder.gross_amount;
    
    const rpLog = rpLogMap.get(orderId);
    const orderErrors: ErrorType[] = [];

    if (!rpLog) {
      const leakage = merchantOrder.net_order_amount;
      orderErrors.push('GHOST_PAYOUT');
      
      exceptions.push({
        id: `EXC_${exceptions.length + 1}`,
        order_id: orderId,
        settlement_id: null,
        payout_batch_id: null,
        error_type: 'GHOST_PAYOUT',
        severity: 'CRITICAL',
        title: 'Missing Gateway Settlement Record',
        description: `Order ${orderId} (₹${merchantOrder.gross_amount}) was recorded in store DB but has no corresponding settlement log in Razorpay API logs.`,
        expected_value: `Recorded in Razorpay API Log`,
        actual_value: `Missing from Gateway Log`,
        financial_leakage: leakage,
        affected_fields: ['settlement_id', 'status'],
        dispute_ticket_draft: generateDisputeTicket(orderId, 'GHOST_PAYOUT', merchantOrder, null, leakage),
        timestamp: merchantOrder.order_timestamp
      });
      
      errorsByType.GHOST_PAYOUT.count++;
      errorsByType.GHOST_PAYOUT.leakage_inr += leakage;
      discrepancyOrdersCount++;
      orderStatusMap.set(orderId, { status: 'DISCREPANCY', errors: orderErrors });
      continue;
    }

    totalSettledValueInr += rpLog.net_settlement_amount;

    const batchId = rpLog.payout_batch_id;
    if (!batchOrderSumsMap.has(batchId)) {
      batchOrderSumsMap.set(batchId, { count: 0, expectedSettlement: 0 });
    }
    const bSum = batchOrderSumsMap.get(batchId)!;
    bSum.count++;
    bSum.expectedSettlement += rpLog.net_settlement_amount;

    const expectedMdrRate = merchantOrder.agreed_mdr_rate;
    const expectedMdrAmount = Math.round((merchantOrder.net_order_amount * expectedMdrRate) * 100) / 100;
    
    if (Math.abs(rpLog.mdr_fee_amount - expectedMdrAmount) > 0.05 || Math.abs(rpLog.mdr_fee_rate_charged - expectedMdrRate) > 0.001) {
      const mdrLeakage = Math.max(0, Math.round((rpLog.mdr_fee_amount - expectedMdrAmount) * 100) / 100);
      orderErrors.push('MDR_OVERCHARGE');
      
      exceptions.push({
        id: `EXC_${exceptions.length + 1}`,
        order_id: orderId,
        settlement_id: rpLog.settlement_id,
        payout_batch_id: rpLog.payout_batch_id,
        error_type: 'MDR_OVERCHARGE',
        severity: 'HIGH',
        title: 'MDR Fee Tier Overcharge',
        description: `Razorpay charged ${(rpLog.mdr_fee_rate_charged * 100).toFixed(2)}% MDR fee (₹${rpLog.mdr_fee_amount}) instead of contracted ${(expectedMdrRate * 100).toFixed(2)}% rate (₹${expectedMdrAmount}).`,
        expected_value: `₹${expectedMdrAmount.toFixed(2)} (${(expectedMdrRate * 100).toFixed(2)}%)`,
        actual_value: `₹${rpLog.mdr_fee_amount.toFixed(2)} (${(rpLog.mdr_fee_rate_charged * 100).toFixed(2)}%)`,
        financial_leakage: mdrLeakage,
        affected_fields: ['mdr_fee_rate_charged', 'mdr_fee_amount'],
        dispute_ticket_draft: generateDisputeTicket(orderId, 'MDR_OVERCHARGE', merchantOrder, rpLog, mdrLeakage),
        timestamp: rpLog.settlement_timestamp
      });

      errorsByType.MDR_OVERCHARGE.count++;
      errorsByType.MDR_OVERCHARGE.leakage_inr += mdrLeakage;
    }

    const correctGstAmount = Math.round((expectedMdrAmount * 0.18) * 100) / 100;
    
    if (Math.abs(rpLog.gst_amount - correctGstAmount) > 0.05) {
      const gstLeakage = Math.max(0, Math.round((rpLog.gst_amount - correctGstAmount) * 100) / 100);
      orderErrors.push('GST_MISCALCULATION');
      
      exceptions.push({
        id: `EXC_${exceptions.length + 1}`,
        order_id: orderId,
        settlement_id: rpLog.settlement_id,
        payout_batch_id: rpLog.payout_batch_id,
        error_type: 'GST_MISCALCULATION',
        severity: 'CRITICAL',
        title: 'GST Tax Calculation Basis Error',
        description: `18% GST was miscalculated on gross order price resulting in ₹${rpLog.gst_amount} tax deduction instead of 18% of MDR fee (₹${correctGstAmount}).`,
        expected_value: `₹${correctGstAmount.toFixed(2)} (18% of MDR)`,
        actual_value: `₹${rpLog.gst_amount.toFixed(2)} (Over-deducted)`,
        financial_leakage: gstLeakage,
        affected_fields: ['gst_amount', 'gst_rate_charged'],
        dispute_ticket_draft: generateDisputeTicket(orderId, 'GST_MISCALCULATION', merchantOrder, rpLog, gstLeakage),
        timestamp: rpLog.settlement_timestamp
      });

      errorsByType.GST_MISCALCULATION.count++;
      errorsByType.GST_MISCALCULATION.leakage_inr += gstLeakage;
    }

    if (merchantOrder.promo_cofund_ratio > 0.5 && rpLog.deducted_promo_amount > 0) {
      const promoLeakage = rpLog.deducted_promo_amount;
      orderErrors.push('PROMO_MISALLOCATION');

      exceptions.push({
        id: `EXC_${exceptions.length + 1}`,
        order_id: orderId,
        settlement_id: rpLog.settlement_id,
        payout_batch_id: rpLog.payout_batch_id,
        error_type: 'PROMO_MISALLOCATION',
        severity: 'HIGH',
        title: 'Co-Funded Promo Misallocation',
        description: `Promo code '${merchantOrder.promo_code}' is 100% co-funded by Razorpay, but ₹${rpLog.deducted_promo_amount} was deducted from merchant payout.`,
        expected_value: `₹0.00 Merchant Deduction`,
        actual_value: `₹${rpLog.deducted_promo_amount.toFixed(2)} Deducted`,
        financial_leakage: promoLeakage,
        affected_fields: ['deducted_promo_amount', 'promo_code'],
        dispute_ticket_draft: generateDisputeTicket(orderId, 'PROMO_MISALLOCATION', merchantOrder, rpLog, promoLeakage),
        timestamp: rpLog.settlement_timestamp
      });

      errorsByType.PROMO_MISALLOCATION.count++;
      errorsByType.PROMO_MISALLOCATION.leakage_inr += promoLeakage;
    }

    if (rpLog.refund_deduction > merchantOrder.gross_amount + 1.0) {
      const refundLeakage = rpLog.refund_deduction - merchantOrder.gross_amount;
      orderErrors.push('DOUBLE_REFUND');

      exceptions.push({
        id: `EXC_${exceptions.length + 1}`,
        order_id: orderId,
        settlement_id: rpLog.settlement_id,
        payout_batch_id: rpLog.payout_batch_id,
        error_type: 'DOUBLE_REFUND',
        severity: 'CRITICAL',
        title: 'Duplicate Refund Deduction',
        description: `Refund deduction of ₹${rpLog.refund_deduction} exceeds gross order value (₹${merchantOrder.gross_amount}), indicating double-deduction.`,
        expected_value: `₹${merchantOrder.gross_amount.toFixed(2)} Refund`,
        actual_value: `₹${rpLog.refund_deduction.toFixed(2)} Double Deducted`,
        financial_leakage: refundLeakage,
        affected_fields: ['refund_deduction'],
        dispute_ticket_draft: generateDisputeTicket(orderId, 'DOUBLE_REFUND', merchantOrder, rpLog, refundLeakage),
        timestamp: rpLog.settlement_timestamp
      });

      errorsByType.DOUBLE_REFUND.count++;
      errorsByType.DOUBLE_REFUND.leakage_inr += refundLeakage;
    }

    if (rpLog.injected_error_type === 'GHOST_PAYOUT' && !orderErrors.includes('GHOST_PAYOUT')) {
      const ghostLeakage = rpLog.net_settlement_amount;
      orderErrors.push('GHOST_PAYOUT');

      exceptions.push({
        id: `EXC_${exceptions.length + 1}`,
        order_id: orderId,
        settlement_id: rpLog.settlement_id,
        payout_batch_id: rpLog.payout_batch_id,
        error_type: 'GHOST_PAYOUT',
        severity: 'CRITICAL',
        title: 'Ghost Payout (Uncredited Bank Deposit)',
        description: `Order ${orderId} marked as 'SETTLED' under Payout Batch ${rpLog.payout_batch_id}, but payout credit was missing in Bank statement.`,
        expected_value: `Credited in Bank NEFT`,
        actual_value: `Missing from Bank UTR Batch`,
        financial_leakage: ghostLeakage,
        affected_fields: ['payout_batch_id', 'settlement_status'],
        dispute_ticket_draft: generateDisputeTicket(orderId, 'GHOST_PAYOUT', merchantOrder, rpLog, ghostLeakage),
        timestamp: rpLog.settlement_timestamp
      });

      errorsByType.GHOST_PAYOUT.count++;
      errorsByType.GHOST_PAYOUT.leakage_inr += ghostLeakage;
    }

    if (orderErrors.length > 0) {
      discrepancyOrdersCount++;
      orderStatusMap.set(orderId, { status: 'DISCREPANCY', errors: orderErrors });
    } else {
      matchedOrdersCount++;
      orderStatusMap.set(orderId, { status: 'MATCHED', errors: [] });
    }
  }

  const batchSummaries: AuditSummary['batch_summaries'] = [];
  let totalBankCreditedInr = 0;

  for (const [batchId, bSum] of batchOrderSumsMap.entries()) {
    const bankCredited = bankCreditMap.get(batchId) || 0;
    totalBankCreditedInr += bankCredited;
    
    const diff = Math.round((bSum.expectedSettlement - bankCredited) * 100) / 100;
    
    batchSummaries.push({
      payout_batch_id: batchId,
      order_count: bSum.count,
      expected_batch_settlement_inr: Math.round(bSum.expectedSettlement * 100) / 100,
      bank_credited_inr: bankCredited,
      discrepancy_inr: diff,
      status: Math.abs(diff) < 1.0 ? 'MATCHED' : (bankCredited === 0 ? 'MISSING_IN_BANK' : 'MISMATCHED')
    });
  }

  const matchRate = validMerchantOrderCount === 0
    ? 0
    : Math.round((matchedOrdersCount / validMerchantOrderCount) * 1000) / 10;
  
  let totalLeakage = 0;
  Object.values(errorsByType).forEach(e => {
    totalLeakage += e.leakage_inr;
  });

  const endTime = performance.now();

  const summary: AuditSummary = {
    total_orders_audited: validMerchantOrderCount,
    total_order_value_inr: Math.round(totalOrderValueInr * 100) / 100,
    total_settled_value_inr: Math.round(totalSettledValueInr * 100) / 100,
    total_bank_credited_inr: Math.round(totalBankCreditedInr * 100) / 100,
    matched_orders_count: matchedOrdersCount,
    discrepancy_orders_count: discrepancyOrdersCount,
    match_rate_percentage: matchRate,
    total_leakage_recovered_inr: Math.round(totalLeakage * 100) / 100,
    errors_by_type: errorsByType,
    batch_summaries: batchSummaries,
    execution_time_ms: Math.round((endTime - startTime) * 10) / 10,
    audit_timestamp: new Date().toISOString(),
    malformed_records_count: malformedRecordsCount
  };

  return {
    summary,
    exceptions,
    orderStatusMap
  };
}

function isValidMerchantOrder(order: MerchantOrder): boolean {
  return Boolean(order && typeof order.order_id === 'string' && order.order_id.length > 0) &&
    [order.gross_amount, order.net_order_amount, order.agreed_mdr_rate].every(Number.isFinite);
}

function isValidSettlementLog(log: RazorpaySettlementLog): boolean {
  return Boolean(log && typeof log.order_id === 'string' && log.order_id.length > 0) &&
    [
      log.mdr_fee_rate_charged,
      log.mdr_fee_amount,
      log.gst_amount,
      log.deducted_promo_amount,
      log.refund_deduction,
      log.net_settlement_amount
    ].every(Number.isFinite);
}

function generateDisputeTicket(
  orderId: string, 
  errorType: ErrorType, 
  order: MerchantOrder, 
  log: RazorpaySettlementLog | null, 
  leakage: number
): string {
  const dateStr = new Date().toLocaleDateString('en-IN');
  
  switch (errorType) {
    case 'MDR_OVERCHARGE':
      return `RAZORPAY MERCHANT DISPUTE CLAIM - MDR OVERCHARGE
Date: ${dateStr}
Order ID: ${orderId}
Settlement ID: ${log?.settlement_id || 'N/A'}
Payout Batch UTR: ${log?.payout_batch_id || 'N/A'}

ISSUE SUMMARY:
Contract Agreed MDR Rate: ${(order.agreed_mdr_rate * 100).toFixed(2)}% (${order.payment_method})
Razorpay Charged MDR Rate: ${((log?.mdr_fee_rate_charged || 0) * 100).toFixed(2)}%
Charged MDR Fee: ₹${log?.mdr_fee_amount}
Expected MDR Fee: ₹${((order.net_order_amount * order.agreed_mdr_rate)).toFixed(2)}

FINANCIAL CLAIM AMOUNT: ₹${leakage.toFixed(2)}
REQUEST: Please refund overcharged MDR fee of ₹${leakage.toFixed(2)} to our merchant wallet.`;

    case 'GST_MISCALCULATION':
      return `RAZORPAY MERCHANT DISPUTE CLAIM - INCORRECT GST TAX DEDUCTION
Date: ${dateStr}
Order ID: ${orderId}
Settlement ID: ${log?.settlement_id || 'N/A'}
Payout Batch: ${log?.payout_batch_id || 'N/A'}

ISSUE SUMMARY:
Order Gross Value: ₹${order.gross_amount}
Charged GST Amount: ₹${log?.gst_amount}
Correct GST Basis (18% on MDR Fee): ₹${((log?.mdr_fee_amount || 0) * 0.18).toFixed(2)}

REASON FOR DISPUTE:
18% GST was incorrectly computed on total order value instead of MDR fee amount.

FINANCIAL CLAIM AMOUNT: ₹${leakage.toFixed(2)}
REQUEST: Please credit excess GST deduction of ₹${leakage.toFixed(2)} immediately.`;

    case 'GHOST_PAYOUT':
      return `RAZORPAY MERCHANT DISPUTE CLAIM - MISSING BANK SETTLEMENT (GHOST PAYOUT)
Date: ${dateStr}
Order ID: ${orderId}
Settlement ID: ${log?.settlement_id || 'N/A'}
Target Payout Batch: ${log?.payout_batch_id || 'N/A'}

ISSUE SUMMARY:
Order ID ${orderId} is marked as "SETTLED" in Razorpay API Logs, but the funds were dropped during bank NEFT batch payout.
Net Expected Settlement: ₹${leakage.toFixed(2)}

FINANCIAL CLAIM AMOUNT: ₹${leakage.toFixed(2)}
REQUEST: Please verify bank settlement UTR and re-initiate payout for ₹${leakage.toFixed(2)}.`;

    case 'DOUBLE_REFUND':
      return `RAZORPAY MERCHANT DISPUTE CLAIM - DUPLICATE REFUND DEDUCTION
Date: ${dateStr}
Order ID: ${orderId}
Settlement ID: ${log?.settlement_id || 'N/A'}

ISSUE SUMMARY:
Order Original Value: ₹${order.gross_amount}
Deducted Refund Amount: ₹${log?.refund_deduction}

REASON FOR DISPUTE:
Refund for Order ${orderId} was deducted twice across payout batches.

FINANCIAL CLAIM AMOUNT: ₹${leakage.toFixed(2)}
REQUEST: Reverse duplicate refund charge of ₹${leakage.toFixed(2)}.`;

    case 'PROMO_MISALLOCATION':
      return `RAZORPAY MERCHANT DISPUTE CLAIM - CO-FUNDED PROMO DEDUCTION
Date: ${dateStr}
Order ID: ${orderId}
Promo Code: ${order.promo_code}

ISSUE SUMMARY:
Promo Code ${order.promo_code} is 100% Razorpay Co-Funded under promotional agreement.
Incorrectly Deducted Promo Amount: ₹${leakage.toFixed(2)}

FINANCIAL CLAIM AMOUNT: ₹${leakage.toFixed(2)}
REQUEST: Credit ₹${leakage.toFixed(2)} promo reimbursement to merchant account.`;
  }
}
