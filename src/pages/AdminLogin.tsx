import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff, ShieldCheck } from 'lucide-react';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('admin_token')) navigate('/admin');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed.');
      localStorage.setItem('admin_token', data.token);
      localStorage.setItem('admin_email', data.email);
      navigate('/admin');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-5 pt-24 pb-16">
      <div className="w-full max-w-md bg-panel border border-line p-8 md:p-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center text-gold">
            <ShieldCheck size={18} />
          </div>
          <p className="text-gold uppercase tracking-[0.2em] text-xs">Admin Portal</p>
        </div>
        <h1 className="font-display text-3xl mb-8">Sign in to manage</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-cream-dim" />
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@clotherapy.com" className="w-full bg-ink border border-line focus:border-gold pl-11 pr-4 py-3.5 text-sm outline-none transition-colors" />
          </div>
          <div className="relative">
            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-cream-dim" />
            <input type={showPw ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" className="w-full bg-ink border border-line focus:border-gold pl-11 pr-11 py-3.5 text-sm outline-none transition-colors" />
            <button type="button" onClick={() => setShowPw(s => !s)} className="absolute right-4 top-1/2 -translate-y-1/2 text-cream-dim hover:text-gold">
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button disabled={submitting} className="w-full bg-gold text-ink py-3.5 uppercase tracking-widest text-sm font-semibold hover:bg-gold-bright transition-colors disabled:opacity-60">
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 p-4 bg-ink border border-line rounded text-xs text-cream-dim space-y-1">
          <p className="text-gold uppercase tracking-wider text-[10px] mb-2">Credentials</p>
          <p>Email: <span className="text-cream">admin@clotherapy.com</span></p>
          <p>Password: <span className="text-cream">Clotherapy@Admin2024</span></p>
        </div>
      </div>
    </div>
  );
}
