import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateAgentResponse } from './aiAgentService';
import { generateSyntheticDataset } from './syntheticDataGenerator';
import { runReconciliationAudit } from './auditEngine';

const audit = runReconciliationAudit(generateSyntheticDataset(20, true, 5));

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe('generateAgentResponse', () => {
  it('uses the deterministic fallback when Groq is not configured', async () => {
    vi.stubEnv('VITE_GROQ_API_KEY', '');
    const result = await generateAgentResponse('Summarize the audit', audit.summary, audit.exceptions);

    expect(result.mode).toBe('fallback');
    expect(result.message.sender).toBe('agent');
  });

  it('falls back with a clear rate-limit status on a 429 response', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-05T00:00:00Z'));
    vi.stubEnv('VITE_GROQ_API_KEY', 'test-key');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 429 })));

    const result = await generateAgentResponse('Why was the payout lower?', audit.summary, audit.exceptions);

    expect(result.mode).toBe('rate_limited');
    expect(result.message.text).toContain('rate-limiting');
    vi.advanceTimersByTime(1201);
  });

  it('returns the model response when Groq succeeds', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-05T00:01:00Z'));
    vi.stubEnv('VITE_GROQ_API_KEY', 'test-key');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      choices: [{ message: { content: 'The audit found a payout variance.' } }]
    }), { status: 200 })));

    const result = await generateAgentResponse('Why was the payout lower?', audit.summary, audit.exceptions);

    expect(result.mode).toBe('groq');
    expect(result.message.text).toBe('The audit found a payout variance.');
  });
});