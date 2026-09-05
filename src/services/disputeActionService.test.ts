import { afterEach, describe, expect, it, vi } from 'vitest';
import { contestRazorpayDispute, listRazorpayDisputes } from './disputeActionService';
import type { ReconciliationException } from '../types/reconciliation';

const exception = {
  error_type: 'MDR_OVERCHARGE',
  financial_leakage: 123.45,
  dispute_ticket_draft: 'MDR overcharge claim for ORD_10015'
} as ReconciliationException;

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Razorpay dispute adapter', () => {
  it('lists available disputes through the server adapter', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      disputes: [{ id: 'disp_test_1', payment_id: 'pay_test_1', amount: 5000, currency: 'INR', status: 'open', phase: 'chargeback' }]
    }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(listRazorpayDisputes()).resolves.toMatchObject([{ id: 'disp_test_1', status: 'open' }]);
    expect(fetchMock).toHaveBeenCalledWith('/api/razorpay/disputes');
  });

  it('sends a draft contest request with the audit amount in paise', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      dispute: { id: 'disp_test_1', status: 'open' }
    }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await contestRazorpayDispute(exception, 'disp_test_1');
    const request = fetchMock.mock.calls[0][1] as RequestInit;

    expect(result.ticketId).toBe('disp_test_1');
    expect(JSON.parse(request.body as string)).toMatchObject({
      disputeId: 'disp_test_1',
      amount: 12345
    });
  });

  it('surfaces Razorpay adapter errors to the caller', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: 'Razorpay server credentials are not configured.' }), { status: 500 })));

    await expect(listRazorpayDisputes()).rejects.toThrow('Razorpay server credentials are not configured.');
  });
});