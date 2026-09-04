import type { 
  MerchantOrder, 
  RazorpaySettlementLog, 
  BankStatementCredit, 
  SyntheticDataset, 
  ErrorType, 
  PaymentMethod 
} from '../types/reconciliation';

function pseudorandom(seed: number) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

const CUSTOMER_NAMES = [
  'Aarav Sharma', 'Priya Patel', 'Rohan Gupta', 'Ananya Verma', 'Vikram Singh',
  'Meera Reddy', 'Aditya Joshi', 'Kavya Nair', 'Siddharth Rao', 'Neha Agarwal',
  'Kabir Kumar', 'Diya Choudhury', 'Arjun Mehta', 'Ishita Bannerjee', 'Devansh Shah'
];

const PROMO_CODES = [
  { code: 'RAZORPAY50', discount: 50, cofund: 1.0 },
  { code: 'FESTIVE100', discount: 100, cofund: 1.0 },
  { code: 'SUPER200', discount: 200, cofund: 0.5 },
  { code: 'WELCOME10', discount: 150, cofund: 0.0 }
];

const PAYMENT_METHODS: PaymentMethod[] = ['UPI', 'CREDIT_CARD', 'DEBIT_CARD', 'NET_BANKING'];

export function generateSyntheticDataset(
  totalCount: number = 500,
  injectErrors: boolean = true,
  targetErrorCount: number = 25
): SyntheticDataset {
  let seed = 12345;
  const merchantOrders: MerchantOrder[] = [];
  const razorpayLogs: RazorpaySettlementLog[] = [];
  const bankCreditsMap: Map<string, { expected: number; actual: number; date: string }> = new Map();
  const errorManifest: Array<{ order_id: string; error_type: ErrorType; description: string }> = [];

  const errorIndices = new Map<number, ErrorType>();
  if (injectErrors && targetErrorCount > 0) {
    const errorTypes: ErrorType[] = [
      'MDR_OVERCHARGE',
      'GST_MISCALCULATION',
      'GHOST_PAYOUT',
      'DOUBLE_REFUND',
      'PROMO_MISALLOCATION'
    ];
    
    const errorsPerType = Math.floor(targetErrorCount / errorTypes.length);
    let count = 0;
    
    for (let t = 0; t < errorTypes.length; t++) {
      const errType = errorTypes[t];
      for (let i = 0; i < errorsPerType; i++) {
        const targetIndex = Math.floor(15 + (count * (totalCount - 30) / targetErrorCount));
        errorIndices.set(targetIndex, errType);
        count++;
      }
    }
  }

  const batchCount = 5;
  const batches = Array.from({ length: batchCount }, (_, i) => `BATCH_2026090${i + 1}_AX`);

  for (let i = 0; i < totalCount; i++) {
    const orderId = `ORD_${10000 + i}`;
    const txnId = `pay_${99000000 + i}`;
    const settlementId = `set_${88000000 + i}`;
    const batchId = batches[i % batchCount];
    
    const customerName = CUSTOMER_NAMES[Math.floor(pseudorandom(seed++) * CUSTOMER_NAMES.length)];
    const paymentMethod = PAYMENT_METHODS[Math.floor(pseudorandom(seed++) * PAYMENT_METHODS.length)];
    
    const baseAmounts = [499, 999, 1499, 2499, 4999, 7999, 12500, 15000, 25000];
    const grossAmount = baseAmounts[Math.floor(pseudorandom(seed++) * baseAmounts.length)];
    
    let agreedMdrRate = 0.015;
    if (paymentMethod === 'CREDIT_CARD') agreedMdrRate = 0.020;
    if (paymentMethod === 'DEBIT_CARD') agreedMdrRate = 0.012;
    if (paymentMethod === 'NET_BANKING') agreedMdrRate = 0.018;

    let appliedDiscount = 0;
    let promoCode: string | null = null;
    let promoCofundRatio = 0.0;
    
    if (pseudorandom(seed++) < 0.25) {
      const promo = PROMO_CODES[Math.floor(pseudorandom(seed++) * PROMO_CODES.length)];
      promoCode = promo.code;
      appliedDiscount = promo.discount;
      promoCofundRatio = promo.cofund;
    }

    const isRefunded = (pseudorandom(seed++) < 0.03);
    const netOrderAmount = grossAmount - appliedDiscount;

    const injectedError = errorIndices.get(i);

    let chargedMdrRate = agreedMdrRate;
    let chargedMdrAmount = Math.round((netOrderAmount * chargedMdrRate) * 100) / 100;
    let chargedGstRate = 0.18;
    let chargedGstAmount = Math.round((chargedMdrAmount * chargedGstRate) * 100) / 100;
    let deductedPromoAmount = 0;
    let refundDeduction = isRefunded ? grossAmount : 0;

    let errorDescription = '';

    if (injectedError) {
      switch (injectedError) {
        case 'MDR_OVERCHARGE':
          chargedMdrRate = agreedMdrRate + 0.01;
          chargedMdrAmount = Math.round((netOrderAmount * chargedMdrRate) * 100) / 100;
          chargedGstAmount = Math.round((chargedMdrAmount * chargedGstRate) * 100) / 100;
          errorDescription = `MDR Rate Overcharge: Contract agreed ${(agreedMdrRate * 100).toFixed(1)}%, but Razorpay charged ${(chargedMdrRate * 100).toFixed(1)}%.`;
          break;

        case 'GST_MISCALCULATION':
          chargedGstAmount = Math.round((grossAmount * 0.18) * 100) / 100;
          errorDescription = `GST Tax Miscalculation: 18% GST was calculated on total order value (₹${grossAmount}) resulting in ₹${chargedGstAmount} tax instead of 18% of MDR fee (₹${(chargedMdrAmount * 0.18).toFixed(2)}).`;
          break;

        case 'PROMO_MISALLOCATION':
          promoCode = 'RAZORPAY50_COFUND';
          appliedDiscount = 100;
          promoCofundRatio = 1.0;
          deductedPromoAmount = 100;
          errorDescription = `Promo Discount Misallocation: Co-funded coupon ${promoCode} (100% PG funded) was wrongly deducted from merchant payout batch.`;
          break;

        case 'DOUBLE_REFUND':
          refundDeduction = grossAmount * 2;
          errorDescription = `Double Refund Deduction: Refund for order ${orderId} (₹${grossAmount}) was deducted twice from settlement.`;
          break;

        case 'GHOST_PAYOUT':
          errorDescription = `Ghost Payout / Bank Dropped Settlement: Order ${orderId} logged as settled under ${batchId}, but excluded from NEFT bank credit.`;
          break;
      }

      errorManifest.push({
        order_id: orderId,
        error_type: injectedError,
        description: errorDescription
      });
    }

    const netSettlementAmount = Math.round(
      (grossAmount - chargedMdrAmount - chargedGstAmount - deductedPromoAmount - refundDeduction) * 100
    ) / 100;

    merchantOrders.push({
      order_id: orderId,
      order_timestamp: new Date(Date.now() - (totalCount - i) * 3600000).toISOString(),
      customer_id: `CUST_${5000 + i}`,
      customer_name: customerName,
      payment_method: paymentMethod,
      gross_amount: grossAmount,
      applied_discount: appliedDiscount,
      promo_code: promoCode,
      promo_cofund_ratio: promoCofundRatio,
      net_order_amount: netOrderAmount,
      agreed_mdr_rate: agreedMdrRate,
      status: isRefunded ? 'REFUNDED' : 'COMPLETED',
      injected_error_type: injectedError
    });

    razorpayLogs.push({
      settlement_id: settlementId,
      transaction_id: txnId,
      order_id: orderId,
      payment_method: paymentMethod,
      charged_amount: grossAmount,
      mdr_fee_rate_charged: chargedMdrRate,
      mdr_fee_amount: chargedMdrAmount,
      gst_rate_charged: chargedGstRate,
      gst_amount: chargedGstAmount,
      deducted_promo_amount: deductedPromoAmount,
      refund_deduction: refundDeduction,
      net_settlement_amount: netSettlementAmount,
      settlement_status: 'SETTLED',
      payout_batch_id: batchId,
      settlement_timestamp: new Date(Date.now() - (totalCount - i) * 3600000 + 86400000).toISOString(),
      injected_error_type: injectedError
    });

    if (!bankCreditsMap.has(batchId)) {
      bankCreditsMap.set(batchId, {
        expected: 0,
        actual: 0,
        date: new Date(Date.now() - (totalCount - i) * 3600000 + 86400000).toISOString().split('T')[0]
      });
    }
    
    const bInfo = bankCreditsMap.get(batchId)!;
    bInfo.expected += netSettlementAmount;

    if (injectedError !== 'GHOST_PAYOUT') {
      bInfo.actual += netSettlementAmount;
    }
  }

  const bankCredits: BankStatementCredit[] = Array.from(bankCreditsMap.entries()).map(([batchId, bInfo], idx) => ({
    bank_utr: `UTR_ICICI_${202609001 + idx}`,
    payout_batch_id: batchId,
    deposit_date: bInfo.date,
    remitter_name: 'RAZORPAY SOFTWARE PVT LTD',
    credit_amount: Math.round(bInfo.actual * 100) / 100,
    status: 'CREDITED'
  }));

  return {
    merchant_orders: merchantOrders,
    razorpay_logs: razorpayLogs,
    bank_credits: bankCredits,
    injected_errors_count: errorManifest.length,
    error_manifest: errorManifest
  };
}
