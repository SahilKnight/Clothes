import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, LogOut, ShieldCheck, User as UserIcon } from 'lucide-react';
import supabase from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { isAdminEmail } from '../lib/admin';

interface OrderRow {
  id: number;
  items: any[];
  total: number;
  address: string;
  created_at: string;
}

export default function Account() {
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!session) return;
    fetch('/api/my-orders', { headers: { Authorization: `Bearer ${session.access_token}` } })
      .then(async r => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || 'Failed to load orders.');
        setOrders(data);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [session]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="pt-32 pb-24 max-w-4xl mx-auto px-5 md:px-10 min-h-[70vh]">
      <div className="flex items-center gap-4 mb-10">
        <div className="w-14 h-14 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center text-gold"><UserIcon size={22} /></div>
        <div>
          <p className="text-gold uppercase tracking-[0.25em] text-xs mb-1">My Account</p>
          <h1 className="font-display text-2xl md:text-3xl">{user?.email}</h1>
        </div>
      </div>

      {isAdminEmail(user?.email) && (
        <Link to="/admin" className="flex items-center justify-between bg-panel border border-gold/30 px-6 py-4 mb-8 hover:border-gold transition-colors group">
          <span className="flex items-center gap-3 text-gold"><ShieldCheck size={18} /> You have admin access — manage the store</span>
          <span className="text-gold group-hover:translate-x-1 transition-transform">→</span>
        </Link>
      )}

      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-xl flex items-center gap-2"><Package size={18} className="text-gold" /> Order History</h2>
        <button onClick={handleLogout} className="flex items-center gap-2 border border-line px-5 py-2.5 text-xs uppercase tracking-widest hover:border-gold hover:text-gold transition-colors">
          <LogOut size={14} /> Sign Out
        </button>
      </div>

      {loading ? (
        <div className="py-16 flex justify-center"><div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" /></div>
      ) : error ? (
        <p className="text-red-400 text-sm">{error}</p>
      ) : orders.length === 0 ? (
        <div className="py-16 text-center border border-line bg-panel">
          <p className="text-cream-dim mb-4">You haven't placed any orders yet.</p>
          <Link to="/shop" className="text-gold underline underline-offset-4 text-sm">Start Shopping</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(o => (
            <div key={o.id} className="bg-panel border border-line p-6">
              <div className="flex flex-wrap justify-between gap-4 mb-3">
                <div>
                  <p className="font-display text-lg">Order #{o.id}</p>
                  <p className="text-xs text-cream-dim">{new Date(o.created_at).toLocaleString()}</p>
                </div>
                <p className="text-gold text-lg">₹{Number(o.total).toLocaleString('en-IN')}</p>
              </div>
              <p className="text-xs text-cream-dim mb-4">{o.address}</p>
              <div className="flex flex-wrap gap-3">
                {(o.items || []).map((it: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 bg-panel-light px-3 py-2 text-xs text-cream-dim">
                    <img src={it.image} alt={it.name} className="w-8 h-10 object-cover" />
                    <span>{it.name} · {it.color}/{it.size} × {it.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
