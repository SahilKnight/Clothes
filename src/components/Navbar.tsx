import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingBag, Heart, Search, Menu, X, Sun, Moon, User, LogOut, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { isAdminEmail } from '../lib/admin';
import supabase from '../lib/supabase';

const LINKS = [
  { label: 'Shop All', to: '/shop', category: null },
  { label: 'Watches', to: '/shop?category=watches', category: 'watches' },
  { label: 'Shirts', to: '/shop?category=shirts', category: 'shirts' },
  { label: 'T-Shirts', to: '/shop?category=tshirts', category: 'tshirts' },
  { label: 'Outerwear', to: '/shop?category=outerwear', category: 'outerwear' },
  { label: 'Accessories', to: '/shop?category=accessories', category: 'accessories' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [accountOpen, setAccountOpen] = useState(false);
  const { count, openCart } = useCart();
  const { ids } = useWishlist();
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const currentCategory = new URLSearchParams(location.search).get('category');
  const isShopRoot = location.pathname === '/shop' && !currentCategory;

  const isLinkActive = (link: typeof LINKS[number]) => {
    if (location.pathname !== '/shop') return false;
    if (link.category === null) return isShopRoot;
    return currentCategory === link.category;
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setAccountOpen(false);
  }, [location.pathname]);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/shop?q=${encodeURIComponent(searchTerm.trim())}`);
      setSearchOpen(false);
      setSearchTerm('');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setAccountOpen(false);
    navigate('/');
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled || location.pathname !== '/' ? 'bg-ink/90 backdrop-blur-xl border-b border-line' : 'bg-gradient-to-b from-black/60 to-transparent'}`}>
      <div className="max-w-[1600px] mx-auto px-5 md:px-10 flex items-center justify-between h-20">
        <button className="lg:hidden text-cream" onClick={() => setMenuOpen(true)} aria-label="Open menu">
          <Menu size={24} />
        </button>

        <Link to="/" className="font-display text-2xl md:text-3xl tracking-wide text-cream select-none">
          CLOTHE<span className="text-gold-gradient italic">rapy</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-9">
          {LINKS.map(l => {
            const active = isLinkActive(l);
            return (
              <Link key={l.label} to={l.to} className={`text-[13px] uppercase tracking-[0.14em] transition-colors relative group ${active ? 'text-gold' : 'text-cream-dim hover:text-gold'}`}>
                {l.label}
                <span className={`absolute -bottom-1.5 left-0 h-px bg-gold transition-all duration-300 ${active ? 'w-full' : 'w-0 group-hover:w-full'}`} />
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3.5 md:gap-5">
          <button onClick={toggleTheme} className="text-cream hover:text-gold transition-colors" aria-label="Toggle theme">
            {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
          </button>
          <button onClick={() => setSearchOpen(true)} className="text-cream hover:text-gold transition-colors" aria-label="Search">
            <Search size={19} />
          </button>
          <Link to="/wishlist" className={`relative transition-colors ${location.pathname === '/wishlist' ? 'text-gold' : 'text-cream hover:text-gold'}`} aria-label="Wishlist">
            <Heart size={19} fill={location.pathname === '/wishlist' ? 'currentColor' : 'none'} />
            {ids.length > 0 && <span className="absolute -top-2 -right-2 bg-gold text-ink text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{ids.length}</span>}
          </Link>
          <button onClick={openCart} className="relative text-cream hover:text-gold transition-colors" aria-label="Cart">
            <ShoppingBag size={19} />
            {count > 0 && <span className="absolute -top-2 -right-2 bg-gold text-ink text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{count}</span>}
          </button>

          <div className="relative hidden sm:block">
            <button onClick={() => setAccountOpen(o => !o)} className="text-cream hover:text-gold transition-colors" aria-label="Account">
              <User size={19} />
            </button>
            <AnimatePresence>
              {accountOpen && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }} className="absolute right-0 mt-4 w-56 bg-panel border border-line shadow-xl shadow-black/30 py-2 z-50">
                  {user ? (
                    <>
                      <div className="px-4 py-2 border-b border-line mb-1">
                        <p className="text-xs text-cream-dim truncate">Signed in as</p>
                        <p className="text-sm text-cream truncate">{user.email}</p>
                      </div>
                      {isAdminEmail(user.email) && (
                        <Link to="/admin" className="flex items-center gap-2 px-4 py-2.5 text-sm text-gold hover:bg-panel-light transition-colors"><ShieldCheck size={14} /> Admin Dashboard</Link>
                      )}
                      <Link to="/account" className="flex items-center gap-2 px-4 py-2.5 text-sm text-cream-dim hover:text-cream hover:bg-panel-light transition-colors"><User size={14} /> My Account</Link>
                      <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-cream-dim hover:text-cream hover:bg-panel-light transition-colors text-left"><LogOut size={14} /> Sign Out</button>
                    </>
                  ) : (
                    <>
                      <Link to="/login" className="block px-4 py-2.5 text-sm text-cream hover:bg-panel-light transition-colors">Sign In</Link>
                      <Link to="/signup" className="block px-4 py-2.5 text-sm text-cream-dim hover:text-cream hover:bg-panel-light transition-colors">Create Account</Link>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {searchOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-ink/95 backdrop-blur-md z-[60] flex items-start justify-center pt-32 px-5" onClick={() => setSearchOpen(false)}>
            <motion.form initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -30, opacity: 0 }} onClick={e => e.stopPropagation()} onSubmit={submitSearch} className="w-full max-w-xl">
              <div className="flex items-center border-b-2 border-gold pb-3">
                <Search size={22} className="text-gold mr-4" />
                <input autoFocus value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search for watches, shirts, jackets..." className="bg-transparent w-full text-xl md:text-2xl font-display text-cream placeholder:text-cream-dim/50 outline-none" />
                <button type="button" onClick={() => setSearchOpen(false)} className="text-cream-dim hover:text-gold ml-4"><X size={22} /></button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {menuOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 z-[60] lg:hidden" onClick={() => setMenuOpen(false)}>
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 28, stiffness: 260 }} onClick={e => e.stopPropagation()} className="h-full w-[82%] max-w-xs bg-panel border-r border-line p-8 flex flex-col gap-8 overflow-y-auto">
              <div className="flex items-center justify-between">
                <span className="font-display text-xl text-gold-gradient">Menu</span>
                <button onClick={() => setMenuOpen(false)}><X size={22} className="text-cream" /></button>
              </div>
              <nav className="flex flex-col gap-6">
                {LINKS.map(l => {
                  const active = isLinkActive(l);
                  return (
                    <Link key={l.label} to={l.to} className={`text-lg font-display transition-colors ${active ? 'text-gold' : 'text-cream hover:text-gold'}`}>{l.label}</Link>
                  );
                })}
              </nav>
              <div className="border-t border-line pt-6 flex flex-col gap-4">
                <button onClick={toggleTheme} className="flex items-center gap-2 text-sm text-cream-dim hover:text-gold transition-colors">
                  {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />} {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </button>
                {user ? (
                  <>
                    {isAdminEmail(user.email) && <Link to="/admin" className="flex items-center gap-2 text-sm text-gold"><ShieldCheck size={16} /> Admin Dashboard</Link>}
                    <Link to="/account" className="flex items-center gap-2 text-sm text-cream-dim hover:text-gold transition-colors"><User size={16} /> My Account</Link>
                    <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-cream-dim hover:text-gold transition-colors text-left"><LogOut size={16} /> Sign Out</button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="flex items-center gap-2 text-sm text-cream-dim hover:text-gold transition-colors"><User size={16} /> Sign In</Link>
                    <Link to="/signup" className="flex items-center gap-2 text-sm text-cream-dim hover:text-gold transition-colors"><User size={16} /> Create Account</Link>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
