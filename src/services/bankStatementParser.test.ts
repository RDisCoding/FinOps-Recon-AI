import { describe, expect, it } from 'vitest';
import { parseUnstructuredBankStatement, SAMPLE_RAW_BANK_STATEMENT } from './bankStatementParser';

describe('parseUnstructuredBankStatement', () => {
  it('parses a bank-style NEFT/RTGS statement fixture', () => {
    const result = parseUnstructuredBankStatement(SAMPLE_RAW_BANK_STATEMENT);

    expect(result.parsedLines).toHaveLength(5);
    expect(result.bankCredits).toHaveLength(5);
    expect(result.parsedLines[0]).toMatchObject({
      amount: 3691198.12,
      date: '01-09-2026',
      remitter: 'RAZORPAY SOFTWARE PVT LTD',
      status: 'EXTRACTED_SUCCESS'
    });
    expect(result.bankCredits[1].bank_utr).toContain('UTR_ICICI_202609002');
  });
});