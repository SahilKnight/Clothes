import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'POST') {
      const { items, total, name, email, address, razorpay_payment_id } = req.body;
      if (!items || !items.length) return res.status(400).json({ error: 'No items in order.' });
      const finalAddress = razorpay_payment_id ? `${address} · Payment ID: ${razorpay_payment_id}` : address;
      const { data, error } = await supabase
        .from('orders')
        .insert({ items, total, name, email, address: finalAddress })
        .select()
        .single();
      if (error) throw error;
      return res.status(201).json(data);
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}
