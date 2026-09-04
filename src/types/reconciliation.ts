export type PaymentMethod = 'UPI' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'NET_BANKING';

export type ErrorType = 
  | 'MDR_OVERCHARGE'
  | 'GST_MISCALCULATION'
  | 'GHOST_PAYOUT'
  | 'DOUBLE_REFUND'
  | 'PROMO_MISALLOCATION';

export type ReconciliationStatus = 'MATCHED' | 'DISCREPANCY' | 'UNMATCHED';

export interface MerchantOrder {
  order_id: string;
  order_timestamp: string;
  customer_id: string;
  customer_name: string;
  payment_method: PaymentMethod;
  gross_amount: number;
  applied_discount: number;
  promo_code: string | null;
  promo_cofund_ratio: number; // 1.0 = Razorpay co-funds 100%, 0.0 = Merchant funds
  net_order_amount: number; // gross_amount - applied_discount
  agreed_mdr_rate: number; // e.g. 0.015 (1.5%) for UPI, 0.020 (2.0%) for Card
  status: 'COMPLETED' | 'REFUNDED';
  injected_error_type?: ErrorType;
}

export interface RazorpaySettlementLog {
  settlement_id: string;
  transaction_id: string;
  order_id: string;
  payment_method: PaymentMethod;
  charged_amount: number;
  mdr_fee_rate_charged: number;
  mdr_fee_amount: number;
  gst_rate_charged: number; // expected 0.18 (18%) on MDR fee
  gst_amount: number;
  deducted_promo_amount: number;
  refund_deduction: number;
  net_settlement_amount: number;
  settlement_status: 'SETTLED' | 'PENDING' | 'FAILED';
  payout_batch_id: string;
  settlement_timestamp: string;
  injected_error_type?: ErrorType;
}

export interface BankStatementCredit {
  bank_utr: string;
  payout_batch_id: string;
  deposit_date: string;
  remitter_name: string;
  credit_amount: number;
  status: 'CREDITED' | 'FAILED' | 'REVERSED';
}

export interface ReconciliationException {
  id: string;
  order_id: string;
  settlement_id: string | null;
  payout_batch_id: string | null;
  error_type: ErrorType;
  severity: 'HIGH' | 'CRITICAL' | 'MEDIUM';
  title: string;
  description: string;
  expected_value: string;
  actual_value: string;
  financial_leakage: number; // In INR (₹)
  affected_fields: string[];
  dispute_ticket_draft: string;
  timestamp: string;
}

export interface AuditSummary {
  total_orders_audited: number;
  total_order_value_inr: number;
  total_settled_value_inr: number;
  total_bank_credited_inr: number;
  
  matched_orders_count: number;
  discrepancy_orders_count: number;
  match_rate_percentage: number;
  
  total_leakage_recovered_inr: number;
  
  errors_by_type: Record<ErrorType, {
    count: number;
    leakage_inr: number;
  }>;
  
  batch_summaries: Array<{
    payout_batch_id: string;
    order_count: number;
    expected_batch_settlement_inr: number;
    bank_credited_inr: number;
    discrepancy_inr: number;
    status: 'MATCHED' | 'MISMATCHED' | 'MISSING_IN_BANK';
  }>;
  
  execution_time_ms: number;
  audit_timestamp: string;
}

export interface SyntheticDataset {
  merchant_orders: MerchantOrder[];
  razorpay_logs: RazorpaySettlementLog[];
  bank_credits: BankStatementCredit[];
  injected_errors_count: number;
  error_manifest: Array<{ order_id: string; error_type: ErrorType; description: string }>;
}
