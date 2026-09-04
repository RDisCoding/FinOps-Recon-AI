import { describe, expect, it } from 'vitest';
import { generateSyntheticDataset } from './syntheticDataGenerator';
import { runReconciliationAudit } from './auditEngine';

describe('runReconciliationAudit', () => {
  it('detects every injected financial discrepancy rule', () => {
    const result = runReconciliationAudit(generateSyntheticDataset(500, true, 25));
    const detectedTypes = new Set(result.exceptions.map(exception => exception.error_type));

    expect(detectedTypes).toEqual(new Set([
      'MDR_OVERCHARGE',
      'GST_MISCALCULATION',
      'GHOST_PAYOUT',
      'DOUBLE_REFUND',
      'PROMO_MISALLOCATION'
    ]));
    expect(result.summary.malformed_records_count).toBe(0);
    expect(result.summary.total_leakage_recovered_inr).toBeGreaterThan(0);
  });

  it('skips malformed rows without producing invalid summary values', () => {
    const dataset = generateSyntheticDataset(3, false);
    dataset.merchant_orders.push({ ...dataset.merchant_orders[0], order_id: '', gross_amount: Number.NaN });
    dataset.razorpay_logs.push({ ...dataset.razorpay_logs[0], order_id: 'bad_log', mdr_fee_amount: Number.NaN });
    dataset.bank_credits.push({ ...dataset.bank_credits[0], credit_amount: Number.NaN });

    const result = runReconciliationAudit(dataset);

    expect(result.summary.total_orders_audited).toBe(3);
    expect(result.summary.malformed_records_count).toBe(3);
    expect(Object.values(result.summary).every(value => typeof value !== 'number' || Number.isFinite(value))).toBe(true);
  });
});