import supabase from './db-client.js';

const ADMIN_EMAILS = ['admin@clotherapy.com'];

async function requireAdmin(req) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return { ok: false, status: 401, error: 'Unauthorized' };
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return { ok: false, status: 401, error: 'Invalid session' };
  if (!ADMIN_EMAILS.includes((user.email || '').toLowerCase()))
    return { ok: false, status: 403, error: 'Not authorized as admin' };
  return { ok: true, user };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('parent_id', { ascending: true, nullsFirst: true })
        .order('name');
      if (error) throw error;
      return res.status(200).json(data);
    }

    const auth = await requireAdmin(req);
    if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

    if (req.method === 'POST') {
      const { name, image, parent_id } = req.body;
      if (!name || !image) return res.status(400).json({ error: 'Name and image are required.' });
      const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const { data, error } = await supabase
        .from('categories')
        .insert({ name, slug, image, parent_id: parent_id || null })
        .select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === 'PUT') {
      const { id, name, image, parent_id } = req.body;
      if (!id) return res.status(400).json({ error: 'id is required.' });
      const updates = {};
      if (name) { updates.name = name; updates.slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''); }
      if (image) updates.image = image;
      updates.parent_id = parent_id || null;
      const { data, error } = await supabase.from('categories').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'id is required.' });
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}
