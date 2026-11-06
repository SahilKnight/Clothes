import { verifyAdminToken } from './admin-auth.js';

export function requireAdmin(req) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const payload = verifyAdminToken(token);
  if (!payload) return { ok: false, status: 401, error: 'Unauthorized' };
  return { ok: true, email: payload.email };
}
