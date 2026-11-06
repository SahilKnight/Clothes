// Simple admin login — checks env credentials, returns a signed token.
// No Supabase user account needed.
import crypto from 'crypto';

function signToken(email, secret) {
  const payload = Buffer.from(JSON.stringify({ email, iat: Date.now() })).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function verifyAdminToken(token) {
  if (!token) return null;
  try {
    const secret = process.env.ADMIN_JWT_SECRET || process.env.ADMIN_PASSWORD || 'clotherapy-admin-secret';
    const [payload, sig] = token.split('.');
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
    if (expected !== sig) return null;
    return JSON.parse(Buffer.from(payload, 'base64url').toString());
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, password } = req.body || {};
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@clotherapy.com').toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || 'Clotherapy@Admin2024';

  if (!email || !password) return res.status(400).json({ error: 'Email and password required.' });
  if (email.toLowerCase() !== adminEmail || password !== adminPassword) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  const secret = process.env.ADMIN_JWT_SECRET || adminPassword;
  const token = signToken(adminEmail, secret);
  return res.status(200).json({ token, email: adminEmail });
}
