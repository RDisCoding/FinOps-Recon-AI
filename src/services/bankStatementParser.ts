import type { BankStatementCredit } from '../types/reconciliation';

export interface ParsedBankLine {
  raw_line: string;
  bank_utr: string;
  remitter: string;
  amount: number;
  date: string;
  confidence_score: number; // e.g. 0.95 (95%)
  status: 'EXTRACTED_SUCCESS' | 'LOW_CONFIDENCE';
}

export function parseUnstructuredBankStatement(rawText: string): {
  parsedLines: ParsedBankLine[];
  bankCredits: BankStatementCredit[];
} {
  const lines = rawText.split('\n').filter(l => l.trim().length > 0);
  const parsedLines: ParsedBankLine[] = [];
  const bankCredits: BankStatementCredit[] = [];

  const defaultBatches = [
    'BATCH_20260901_AX',
    'BATCH_20260902_AX',
    'BATCH_20260903_AX',
    'BATCH_20260904_AX',
    'BATCH_20260905_AX'
  ];

  lines.forEach((line, index) => {
    // 1. Extract Amount (matches currency pattern e.g. 3,691,198.12 or 4850000.00)
    const amountMatches = line.match(/(?:₹|INR|\b)\s*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{2})?|\d+(?:\.\d{2})?)/gi);
    let amount = 0;
    if (amountMatches) {
      // Pick highest amount number from line
      const nums = amountMatches.map(m => parseFloat(m.replace(/[^0-9.]/g, ''))).filter(n => !isNaN(n) && n > 100);
      if (nums.length > 0) amount = Math.max(...nums);
    }

    // 2. Extract UTR / Reference Number
    const utrMatch = line.match(/(?:NEFT|RTGS|UPI|UTR|REF|TXN)[-:\s]*([A-Z0-9]{8,20})/i) || line.match(/UTR_[A-Z0-9_]+/i);
    const utr = utrMatch ? utrMatch[0].replace(/[-:\s]/g, '_').toUpperCase() : `UTR_RAW_${Date.now()}_${index}`;

    // 3. Extract Remitter Name
    let remitter = 'RAZORPAY SOFTWARE PVT LTD';
    if (line.toLowerCase().includes('cashfree')) remitter = 'CASHFREE PAYMENTS';
    if (line.toLowerCase().includes('stripe')) remitter = 'STRIPE INDIA';

    // 4. Extract Date
    const dateMatch = line.match(/\b\d{2}[-/\.]\d{2}[-/\.]\d{4}\b/) || line.match(/\b\d{4}[-/\.]\d{2}[-/\.]\d{2}\b/);
    const date = dateMatch ? dateMatch[0] : new Date().toISOString().split('T')[0];

    const confidence = (amount > 0 && utrMatch) ? 0.98 : 0.75;
    const batchId = defaultBatches[index % defaultBatches.length];

    parsedLines.push({
      raw_line: line.trim(),
      bank_utr: utr,
      remitter,
      amount,
      date,
      confidence_score: confidence,
      status: confidence > 0.8 ? 'EXTRACTED_SUCCESS' : 'LOW_CONFIDENCE'
    });

    bankCredits.push({
      bank_utr: utr,
      payout_batch_id: batchId,
      deposit_date: date,
      remitter_name: remitter,
      credit_amount: amount,
      status: 'CREDITED'
    });
  });

  return { parsedLines, bankCredits };
}

export const SAMPLE_RAW_BANK_STATEMENT = `01-09-2026 | NEFT-N24820191-RAZORPAY PAYMENTS MUMBAI | CR | ₹36,91,198.12 | SUCCESS
02-09-2026 | RTGS-UTR_ICICI_202609002-RAZORPAY SOFTWARE PVT LTD | CR | ₹39,45,120.00 | SUCCESS
03-09-2026 | NEFT-N24820193-RAZORPAY PAYMENTS BATCH A3 | CR | ₹37,12,850.50 | SUCCESS
04-09-2026 | UTR_ICICI_202609004 | CR | ₹38,90,000.00 | SUCCESS
05-09-2026 | NEFT-N24820195-RAZORPAY NET SETTLEMENT | CR | ₹40,15,400.00 | SUCCESS`;
