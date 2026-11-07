import crypto from 'crypto';
import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action } = req.query;

  try {
    if (action === 'verify') {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;
      const keySecret = process.env.RAZORPAY_KEY_SECRET;
      if (!keySecret) return res.status(500).json({ error: 'Razorpay is not configured.' });
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature)
        return res.status(400).json({ error: 'Missing payment verification fields.' });

      const expected = crypto.createHmac('sha256', keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex');
      const verified = expected === razorpay_signature;

      await supabase.from('payments').insert({
        razorpay_order_id, razorpay_payment_id, razorpay_signature,
        status: verified ? 'verified' : 'failed', amount: amount || null,
      });

      if (!verified) return res.status(400).json({ verified: false, error: 'Signature mismatch.' });
      return res.status(200).json({ verified: true });
    }

    // default: create order
    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'A valid amount is required.' });

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret || keyId.includes('xxx'))
      return res.status(200).json({ demo: true });

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Basic ${auth}` },
      body: JSON.stringify({ amount: Math.round(amount * 100), currency: 'INR', receipt: `rcpt_${Date.now()}` }),
    });
    const data = await rzpRes.json();
    if (!rzpRes.ok) return res.status(500).json({ error: data.error?.description || 'Failed to create order.' });
    return res.status(200).json({ demo: false, id: data.id, amount: data.amount, keyId });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}
