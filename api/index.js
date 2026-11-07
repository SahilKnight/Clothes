import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// ── Supabase ──────────────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ── Admin auth ────────────────────────────────────────────────────────────────
function signToken(email) {
  const secret = process.env.ADMIN_JWT_SECRET || process.env.ADMIN_PASSWORD || 'clotherapy-secret';
  const payload = Buffer.from(JSON.stringify({ email, iat: Date.now() })).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifyAdminToken(token) {
  if (!token) return null;
  try {
    const secret = process.env.ADMIN_JWT_SECRET || process.env.ADMIN_PASSWORD || 'clotherapy-secret';
    const [payload, sig] = token.split('.');
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
    if (expected !== sig) return null;
    return JSON.parse(Buffer.from(payload, 'base64url').toString());
  } catch { return null; }
}

function requireAdmin(req) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const payload = verifyAdminToken(token);
  if (!payload) return { ok: false, status: 401, error: 'Unauthorized' };
  return { ok: true, email: payload.email };
}

// ── Route handlers ────────────────────────────────────────────────────────────
async function handleAdminAuth(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { email, password } = req.body || {};
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@clotherapy.com').toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || 'Clotherapy@Admin2024';
  if (!email || !password) return res.status(400).json({ error: 'Email and password required.' });
  if (email.toLowerCase() !== adminEmail || password !== adminPassword)
    return res.status(401).json({ error: 'Invalid credentials.' });
  return res.status(200).json({ token: signToken(adminEmail), email: adminEmail });
}

async function handleProducts(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const { category, id } = req.query;
  let query = supabase.from('products').select('*').order('id', { ascending: true });
  if (id) {
    const { data, error } = await query.eq('id', id).single();
    if (error) throw error;
    return res.status(200).json(data);
  }
  if (category && category !== 'all') query = query.eq('category', category);
  const { data, error } = await query;
  if (error) throw error;
  return res.status(200).json(data);
}

async function handleOrders(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { items, total, name, email, address, razorpay_payment_id } = req.body;
  if (!items || !items.length) return res.status(400).json({ error: 'No items in order.' });
  const finalAddress = razorpay_payment_id ? `${address} · Payment ID: ${razorpay_payment_id}` : address;
  const { data, error } = await supabase.from('orders').insert({ items, total, name, email, address: finalAddress }).select().single();
  if (error) throw error;
  return res.status(201).json(data);
}

async function handleUser(req, res) {
  const { type } = req.query;
  if (type === 'newsletter' && req.method === 'POST') {
    const { email } = req.body;
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
      return res.status(400).json({ error: 'Valid email required.' });
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
  return res.status(400).json({ error: 'Invalid request' });
}

async function handleAdminCategories(req, res) {
  if (req.method === 'GET') {
    const { data, error } = await supabase.from('categories').select('*').order('name');
    if (error) throw error;
    return res.status(200).json(data);
  }
  const auth = requireAdmin(req);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });
  if (req.method === 'POST') {
    const { name, image } = req.body;
    if (!name || !image) return res.status(400).json({ error: 'Name and image are required.' });
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const { data, error } = await supabase.from('categories').insert({ name, slug, image }).select().single();
    if (error) throw error;
    return res.status(201).json(data);
  }
  if (req.method === 'PUT') {
    const { id, name, image } = req.body;
    if (!id) return res.status(400).json({ error: 'id is required.' });
    const updates = {};
    if (name) { updates.name = name; updates.slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''); }
    if (image) updates.image = image;
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
  return res.status(405).json({ error: 'Method not allowed' });
}

async function handleAdminProducts(req, res) {
  const auth = requireAdmin(req);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });
  if (req.method === 'GET') {
    const { data, error } = await supabase.from('products').select('*').order('id', { ascending: true });
    if (error) throw error;
    return res.status(200).json(data);
  }
  if (req.method === 'POST') {
    const body = req.body;
    const payload = { name: body.name, category: body.category, price: body.price, compare_price: body.compare_price || null, description: body.description || '', image: body.image, gallery: body.gallery || [body.image], colors: body.colors || [], sizes: body.sizes || [], is_new: !!body.is_new, is_featured: !!body.is_featured, rating: body.rating || 4.5 };
    if (!payload.name || !payload.category || !payload.price || !payload.image)
      return res.status(400).json({ error: 'Name, category, price, and image are required.' });
    const { data, error } = await supabase.from('products').insert(payload).select().single();
    if (error) throw error;
    return res.status(201).json(data);
  }
  if (req.method === 'PUT') {
    const { id, ...rest } = req.body;
    if (!id) return res.status(400).json({ error: 'Product id is required.' });
    const payload = {};
    ['name','category','price','compare_price','description','image','gallery','colors','sizes','is_new','is_featured','rating'].forEach(k => { if (rest[k] !== undefined) payload[k] = rest[k]; });
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
  return res.status(405).json({ error: 'Method not allowed' });
}

async function handleAdminData(req, res) {
  const auth = requireAdmin(req);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const { type } = req.query;
  if (type === 'newsletter') {
    const { data, error } = await supabase.from('newsletter_subscribers').select('*').order('id', { ascending: false });
    if (error) throw error;
    return res.status(200).json(data);
  }
  const { data, error } = await supabase.from('orders').select('*').order('id', { ascending: false });
  if (error) throw error;
  return res.status(200).json(data);
}

async function handleAdminUpload(req, res) {
  const auth = requireAdmin(req);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { fileName, fileBase64, contentType } = req.body;
  if (!fileName || !fileBase64) return res.status(400).json({ error: 'fileName and fileBase64 are required.' });
  const buffer = Buffer.from(fileBase64, 'base64');
  const safeName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, '')}`;
  const { error } = await supabase.storage.from('product-images').upload(safeName, buffer, { contentType: contentType || 'image/jpeg', upsert: true });
  if (error) throw error;
  const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(safeName);
  return res.status(200).json({ url: urlData.publicUrl });
}

async function handleRazorpay(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { action } = req.query;
  if (action === 'verify') {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) return res.status(500).json({ error: 'Razorpay not configured.' });
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature)
      return res.status(400).json({ error: 'Missing verification fields.' });
    const expected = crypto.createHmac('sha256', keySecret).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex');
    const verified = expected === razorpay_signature;
    await supabase.from('payments').insert({ razorpay_order_id, razorpay_payment_id, razorpay_signature, status: verified ? 'verified' : 'failed', amount: amount || null });
    if (!verified) return res.status(400).json({ verified: false, error: 'Signature mismatch.' });
    return res.status(200).json({ verified: true });
  }
  const { amount } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Valid amount required.' });
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret || keyId.includes('xxx')) return res.status(200).json({ demo: true });
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
  const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Basic ${auth}` },
    body: JSON.stringify({ amount: Math.round(amount * 100), currency: 'INR', receipt: `rcpt_${Date.now()}` }),
  });
  const data = await rzpRes.json();
  if (!rzpRes.ok) return res.status(500).json({ error: data.error?.description || 'Failed to create order.' });
  return res.status(200).json({ demo: false, id: data.id, amount: data.amount, keyId });
}

// ── Main router ───────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const route = req.url.replace(/^\/api\//, '').split('?')[0];

  try {
    if (route === 'admin-auth') return await handleAdminAuth(req, res);
    if (route === 'products') return await handleProducts(req, res);
    if (route === 'orders') return await handleOrders(req, res);
    if (route === 'user') return await handleUser(req, res);
    if (route === 'admin-categories') return await handleAdminCategories(req, res);
    if (route === 'admin-products') return await handleAdminProducts(req, res);
    if (route === 'admin-data') return await handleAdminData(req, res);
    if (route === 'admin-upload') return await handleAdminUpload(req, res);
    if (route === 'razorpay') return await handleRazorpay(req, res);
    return res.status(404).json({ error: 'Not found' });
  } catch (err) {
    console.error('API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
