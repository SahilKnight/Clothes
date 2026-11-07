import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const { type } = req.query;

  try {
    if (type === 'newsletter' && req.method === 'POST') {
      const { email } = req.body;
      if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
        return res.status(400).json({ error: 'Please provide a valid email address.' });
      const { data: existing } = await supabase.from('newsletter_subscribers').select('id').eq('email', email).maybeSingle();
      if (existing) return res.status(200).json(existing);
      const { data, error } = await supabase.from('newsletter_subscribers').insert({ email }).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (type === 'my-orders' && req.method === 'GET') {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) return res.status(401).json({ error: 'Unauthorized' });
      const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
      if (authErr || !user) return res.status(401).json({ error: 'Invalid session' });
      const { data, error } = await supabase.from('orders').select('*').ilike('email', user.email).order('id', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data);
    }

    res.status(400).json({ error: 'Invalid request' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}
