import supabase from '../lib/db-client.js';
import { requireAdmin } from '../lib/admin-guard.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const auth = requireAdmin(req);
    if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

    if (req.method === 'GET') {
      const { data, error } = await supabase.from('products').select('*').order('id', { ascending: true });
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const body = req.body;
      const payload = {
        name: body.name,
        category: body.category,
        price: body.price,
        compare_price: body.compare_price || null,
        description: body.description || '',
        image: body.image,
        gallery: body.gallery || [body.image],
        colors: body.colors || [],
        sizes: body.sizes || [],
        is_new: !!body.is_new,
        is_featured: !!body.is_featured,
        rating: body.rating || 4.5,
      };
      if (!payload.name || !payload.category || !payload.price || !payload.image) {
        return res.status(400).json({ error: 'Name, category, price, and image are required.' });
      }
      const { data, error } = await supabase.from('products').insert(payload).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === 'PUT') {
      const { id, ...rest } = req.body;
      if (!id) return res.status(400).json({ error: 'Product id is required.' });
      const payload = {};
      ['name', 'category', 'price', 'compare_price', 'description', 'image', 'gallery', 'colors', 'sizes', 'is_new', 'is_featured', 'rating'].forEach(key => {
        if (rest[key] !== undefined) payload[key] = rest[key];
      });
      const { data, error } = await supabase.from('products').update(payload).eq('id', id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'Product id is required.' });
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}
