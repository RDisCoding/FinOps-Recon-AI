interface RequestLike {
  method?: string;
}

interface ResponseLike {
  status: (code: number) => ResponseLike;
  json: (body: unknown) => void;
}

interface RazorpayDisputesResponse {
  items?: Array<{
    id?: string;
    payment_id?: string;
    amount?: number;
    currency?: string;
    status?: string;
    phase?: string;
    respond_by?: number;
  }>;
}

export default async function handler(request: RequestLike, response: ResponseLike) {
  if (request.method !== 'GET') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    return response.status(500).json({ error: 'Razorpay server credentials are not configured.' });
  }

  try {
    const razorpayResponse = await fetch('https://api.razorpay.com/v1/disputes', {
      headers: {
        Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
        'Content-Type': 'application/json'
      }
    });
    const payload = await razorpayResponse.json() as RazorpayDisputesResponse;
    if (!razorpayResponse.ok) {
      return response.status(razorpayResponse.status).json({ error: 'Razorpay rejected the dispute list request.', details: payload });
    }

    const disputes = (payload.items || [])
      .filter(dispute => typeof dispute.id === 'string')
      .map(dispute => ({
        id: dispute.id as string,
        payment_id: dispute.payment_id || '',
        amount: dispute.amount || 0,
        currency: dispute.currency || 'INR',
        status: dispute.status || 'unknown',
        phase: dispute.phase || 'unknown',
        respond_by: dispute.respond_by
      }));
    return response.status(200).json({ disputes });
  } catch {
    return response.status(502).json({ error: 'Unable to reach Razorpay from the server.' });
  }
}