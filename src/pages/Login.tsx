import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff, ShieldCheck, ArrowRight } from 'lucide-react';
import supabase from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { isAdminEmail } from '../lib/admin';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>(location.pathname === '/signup' ? 'signup' : 'signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const redirectTarget = (user?: { email?: string | null } | null) => {
    if (isAdminEmail(user?.email)) return '/admin';
    const from = (location.state as any)?.from?.pathname;
    return from && from !== '/login' && from !== '/signup' ? from : '/account';
  };

  useEffect(() => {
    if (user) navigate(redirectTarget(user), { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    if (!email.trim() || password.length < 6) {
      setError('Please provide a valid email and a password of at least 6 characters.');
      return;
    }
    setSubmitting(true);
    try {
      if (mode === 'signin') {
        const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        navigate(redirectTarget(data.user), { replace: true });
      } else {
        const { data, error: err } = await supabase.auth.signUp({ email, password });
        if (err) throw err;
        if (data.session) {
          navigate(redirectTarget(data.user), { replace: true });
        } else {
          setInfo('Account created! Please check your email to confirm, then sign in.');
          setMode('signin');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-5 pt-24 pb-16">
      <div className="w-full max-w-md bg-panel border border-line p-8 md:p-10">
        <Link to="/" className="font-display text-2xl block mb-8">CLOTHE<span className="text-gold-gradient italic">rapy</span></Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center text-gold"><ShieldCheck size={18} /></div>
          <p className="text-gold uppercase tracking-[0.2em] text-xs">{mode === 'signin' ? 'Welcome Back' : 'Create Account'}</p>
        </div>
        <h1 className="font-display text-3xl mb-8">{mode === 'signin' ? 'Sign in to your account' : 'Join Clotherapy'}</h1>

        <div className="flex gap-2 mb-8 border border-line rounded-full p-1">
          <button onClick={() => { setMode('signin'); setError(''); setInfo(''); }} className={`flex-1 py-2 text-xs uppercase tracking-widest rounded-full transition-colors ${mode === 'signin' ? 'bg-gold text-ink' : 'text-cream-dim hover:text-cream'}`}>Sign In</button>
          <button onClick={() => { setMode('signup'); setError(''); setInfo(''); }} className={`flex-1 py-2 text-xs uppercase tracking-widest rounded-full transition-colors ${mode === 'signup' ? 'bg-gold text-ink' : 'text-cream-dim hover:text-cream'}`}>Sign Up</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-cream-dim" />
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" className="w-full bg-ink border border-line focus:border-gold pl-11 pr-4 py-3.5 text-sm outline-none transition-colors" />
          </div>
          <div className="relative">
            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-cream-dim" />
            <input type={showPw ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" className="w-full bg-ink border border-line focus:border-gold pl-11 pr-11 py-3.5 text-sm outline-none transition-colors" />
            <button type="button" onClick={() => setShowPw(s => !s)} className="absolute right-4 top-1/2 -translate-y-1/2 text-cream-dim hover:text-gold">{showPw ? <EyeOff size={16} /> : <Eye size={16} />}</button>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}
          {info && <p className="text-gold text-sm">{info}</p>}

          <button disabled={submitting} className="w-full bg-gold text-ink py-3.5 uppercase tracking-widest text-sm font-semibold hover:bg-gold-bright transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            {submitting ? 'Please wait...' : <>{mode === 'signin' ? 'Sign In' : 'Create Account'} <ArrowRight size={15} /></>}
          </button>
        </form>

        <p className="text-xs text-cream-dim/60 mt-8 text-center leading-relaxed">Admins: sign in with your admin email and you'll be taken straight to the dashboard.</p>
      </div>
    </div>
  );
}
