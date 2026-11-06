import { Link } from 'react-router-dom';
import { Instagram, Facebook, Twitter } from 'lucide-react';
import { useState } from 'react';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [msg, setMsg] = useState('');

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setStatus('success');
      setMsg('Welcome to the inner circle.');
      setEmail('');
    } catch (err: any) {
      setStatus('error');
      setMsg(err.message);
    }
  };

  return (
    <footer className="bg-panel border-t border-line mt-24">
      <div id="newsletter" className="max-w-[1600px] mx-auto px-5 md:px-10 py-20 grid md:grid-cols-2 gap-10 items-center border-b border-line">
        <div>
          <p className="text-gold uppercase tracking-[0.25em] text-xs mb-3">Join the list</p>
          <h3 className="font-display text-3xl md:text-4xl leading-tight">Get early access to <span className="italic text-gold-gradient">new drops</span> &amp; private sales.</h3>
        </div>
        <form onSubmit={subscribe} className="flex flex-col gap-3">
          <div className="flex items-stretch">
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" className="flex-1 bg-ink border border-line focus:border-gold px-5 py-4 text-sm outline-none transition-colors" />
            <button disabled={status === 'loading'} className="px-7 bg-gold text-ink font-semibold text-sm uppercase tracking-wider hover:bg-gold-bright transition-colors disabled:opacity-60">
              {status === 'loading' ? '...' : 'Subscribe'}
            </button>
          </div>
          {msg && <p className={`text-sm ${status === 'success' ? 'text-gold' : 'text-red-400'}`}>{msg}</p>}
        </form>
      </div>

      <div className="max-w-[1600px] mx-auto px-5 md:px-10 py-16 grid grid-cols-2 md:grid-cols-4 gap-10">
        <div className="col-span-2 md:col-span-1">
          <Link to="/" className="font-display text-2xl">CLOTHE<span className="text-gold-gradient italic">rapy</span></Link>
          <p className="text-cream-dim text-sm mt-4 leading-relaxed max-w-xs">Crafted apparel and accessories for those who dress with intention. Est. for the modern wardrobe.</p>
          <div className="flex gap-4 mt-6">
            <a href="#" className="w-9 h-9 rounded-full border border-line flex items-center justify-center hover:border-gold hover:text-gold transition-colors"><Instagram size={16} /></a>
            <a href="#" className="w-9 h-9 rounded-full border border-line flex items-center justify-center hover:border-gold hover:text-gold transition-colors"><Facebook size={16} /></a>
            <a href="#" className="w-9 h-9 rounded-full border border-line flex items-center justify-center hover:border-gold hover:text-gold transition-colors"><Twitter size={16} /></a>
          </div>
        </div>
        <div>
          <h4 className="uppercase text-xs tracking-[0.2em] text-gold mb-5">Shop</h4>
          <ul className="flex flex-col gap-3 text-sm text-cream-dim">
            <li><Link to="/shop?category=watches" className="hover:text-gold transition-colors">Watches</Link></li>
            <li><Link to="/shop?category=shirts" className="hover:text-gold transition-colors">Shirts</Link></li>
            <li><Link to="/shop?category=tshirts" className="hover:text-gold transition-colors">T-Shirts</Link></li>
            <li><Link to="/shop?category=outerwear" className="hover:text-gold transition-colors">Outerwear</Link></li>
            <li><Link to="/shop?category=accessories" className="hover:text-gold transition-colors">Accessories</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="uppercase text-xs tracking-[0.2em] text-gold mb-5">Company</h4>
          <ul className="flex flex-col gap-3 text-sm text-cream-dim">
            <li><a href="#" className="hover:text-gold transition-colors">Our Story</a></li>
            <li><a href="#" className="hover:text-gold transition-colors">Sustainability</a></li>
            <li><a href="#" className="hover:text-gold transition-colors">Careers</a></li>
            <li><a href="#" className="hover:text-gold transition-colors">Press</a></li>
          </ul>
        </div>
        <div>
          <h4 className="uppercase text-xs tracking-[0.2em] text-gold mb-5">Support</h4>
          <ul className="flex flex-col gap-3 text-sm text-cream-dim">
            <li><a href="#" className="hover:text-gold transition-colors">Shipping &amp; Returns</a></li>
            <li><a href="#" className="hover:text-gold transition-colors">Size Guide</a></li>
            <li><a href="#" className="hover:text-gold transition-colors">Track Order</a></li>
            <li><a href="#" className="hover:text-gold transition-colors">Contact Us</a></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-line py-6 px-5 md:px-10">
        <p className="text-center text-cream-dim/60 text-xs tracking-wide">© {new Date().getFullYear()} Clotherapy. All rights reserved.</p>
      </div>
    </footer>
  );
}
