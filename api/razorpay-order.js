// Creates a Razorpay order. Falls back to a "demo" response (no real
// payment gateway) if RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are not yet
// configured, so the checkout flow keeps working end-to-end while the
// merchant sets up their real Razorpay credentials.
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'A valid amount is required.' });

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      // Demo mode: no real payment gateway configured yet.
      return res.status(200).json({ demo: true, message: 'Razorpay is not configured yet. Order will be recorded without a live payment.' });
    }

    const amountPaise = Math.round(amount * 100);
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

    const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        amount: amountPaise,
        currency: 'INR',
        receipt: `rcpt_${Date.now()}`,
      }),
    });

    const data = await rzpRes.json();
    if (!rzpRes.ok) {
      console.error('Razorpay order error:', data);
      return res.status(500).json({ error: data.error?.description || 'Failed to create Razorpay order.' });
    }

    return res.status(200).json({ demo: false, id: data.id, amount: data.amount, keyId });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}
