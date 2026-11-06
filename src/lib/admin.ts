// Emails allowed to access the admin dashboard.
// The demo admin account (admin@clotherapy.com) is seeded and pre-authorized.
export const ADMIN_EMAILS = ['admin@clotherapy.com'];

export function isAdminEmail(email?: string | null) {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}
