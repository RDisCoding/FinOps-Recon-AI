import { describe, expect, it } from 'vitest';
import { parseUnstructuredBankStatement, SAMPLE_RAW_BANK_STATEMENT } from './bankStatementParser';
import publicBankStatement from './fixtures/public-bank-statement.csv?raw';

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

  it('parses the supplied CSV statement fixture without treating debits as credits', () => {
    const result = parseUnstructuredBankStatement(publicBankStatement);

    expect(result.parsedLines).toHaveLength(2);
    expect(result.bankCredits).toHaveLength(1);
    expect(result.parsedLines[0]).toMatchObject({
      bank_utr: 'UTR987654321011',
      amount: 15000,
      date: '2026-09-01',
      remitter: 'JOHN DOE',
      status: 'EXTRACTED_SUCCESS'
    });
    expect(result.parsedLines[1].bank_utr).toBe('REF776543210982');
  });
});