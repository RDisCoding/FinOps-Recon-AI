interface RequestLike {
  method?: string;
  body?: unknown;
}

interface ResponseLike {
  status: (code: number) => ResponseLike;
  json: (body: unknown) => void;
}

interface ContestRequest {
  disputeId?: string;
  amount?: number;
  summary?: string;
}

export default async function handler(request: RequestLike, response: ResponseLike) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const body = (request.body || {}) as ContestRequest;

  if (!keyId || !keySecret) {
    return response.status(500).json({ error: 'Razorpay server credentials are not configured.' });
  }
  if (!body.disputeId || !/^disp_[A-Za-z0-9]+$/.test(body.disputeId)) {
    return response.status(400).json({ error: 'A valid Razorpay dispute ID is required.' });
  }

  try {
    const razorpayResponse = await fetch(`https://api.razorpay.com/v1/disputes/${body.disputeId}/contest`, {
      method: 'PATCH',
      headers: {
        Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: body.amount,
        summary: body.summary,
        action: 'draft'
      })
    });

    const payload = await razorpayResponse.json();
    return response.status(razorpayResponse.status).json(
      razorpayResponse.ok ? { dispute: payload } : { error: payload.error?.description || 'Razorpay rejected the dispute contest.', details: payload }
    );
  } catch {
    return response.status(502).json({ error: 'Unable to reach Razorpay from the server.' });
  }
}