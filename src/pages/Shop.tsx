import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SlidersHorizontal, X } from 'lucide-react';
import type { Product } from '../lib/types';
import ProductCard from '../components/ProductCard';
import QuickViewModal from '../components/QuickViewModal';

const SORTS = [
  { label: 'Newest', value: 'newest' },
  { label: 'Price: Low to High', value: 'price-asc' },
  { label: 'Price: High to Low', value: 'price-desc' },
];

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [category, setCategory] = useState(params.get('category') || 'all');
  const [sort, setSort] = useState('newest');
  const [query, setQuery] = useState(params.get('q') || '');
  const [filterOpen, setFilterOpen] = useState(false);
  const [quickView, setQuickView] = useState<Product | null>(null);
  const [categories, setCategories] = useState<{ label: string; value: string }[]>([{ label: 'All', value: 'all' }]);

  useEffect(() => {
    fetch('/api/admin-categories')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setCategories([{ label: 'All', value: 'all' }, ...data.map((c: any) => ({ label: c.name, value: c.slug }))]);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setError('');
    fetch('/api/products')
      .then(r => r.json())
      .then(data => setProducts(Array.isArray(data) ? data : []))
      .catch(() => setError('Could not load products. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const p: Record<string, string> = {};
    if (category !== 'all') p.category = category;
    if (query) p.q = query;
    setParams(p, { replace: true });
  }, [category, query]);

  const filtered = useMemo(() => {
    let list = [...products];
    if (category !== 'all') list = list.filter(p => p.category === category);
    if (query) list = list.filter(p => p.name.toLowerCase().includes(query.toLowerCase()));
    if (sort === 'price-asc') list.sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') list.sort((a, b) => b.price - a.price);
    if (sort === 'newest') list.sort((a, b) => b.id - a.id);
    return list;
  }, [products, category, sort, query]);

  return (
    <div className="pt-32 pb-24 max-w-[1600px] mx-auto px-5 md:px-10">
      <div className="mb-14">
        <p className="text-gold uppercase tracking-[0.3em] text-xs mb-3">The Collection</p>
        <h1 className="font-display text-4xl md:text-6xl">Shop <span className="italic text-gold-gradient">All Pieces.</span></h1>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <aside className="hidden md:block w-56 shrink-0">
          <div className="sticky top-28">
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search products..." className="w-full bg-panel border border-line focus:border-gold px-4 py-3 text-sm outline-none mb-8" />
            <h3 className="uppercase text-xs tracking-widest text-gold mb-4">Category</h3>
            <div className="flex flex-col gap-1 mb-10">
              {categories.map(c => (
                <button key={c.value} onClick={() => setCategory(c.value)} className={`text-left py-2 text-sm transition-colors ${category === c.value ? 'text-gold' : 'text-cream-dim hover:text-cream'}`}>{c.label}</button>
              ))}
            </div>
            <h3 className="uppercase text-xs tracking-widest text-gold mb-4">Sort By</h3>
            <div className="flex flex-col gap-1">
              {SORTS.map(s => (
                <button key={s.value} onClick={() => setSort(s.value)} className={`text-left py-2 text-sm transition-colors ${sort === s.value ? 'text-gold' : 'text-cream-dim hover:text-cream'}`}>{s.label}</button>
              ))}
            </div>
          </div>
        </aside>

        <div className="flex-1">
          <div className="flex md:hidden items-center justify-between mb-6">
            <span className="text-sm text-cream-dim">{filtered.length} items</span>
            <button onClick={() => setFilterOpen(true)} className="flex items-center gap-2 text-sm border border-line px-4 py-2 hover:border-gold hover:text-gold transition-colors"><SlidersHorizontal size={14} /> Filter &amp; Sort</button>
          </div>
          <div className="hidden md:block mb-6 text-sm text-cream-dim">{filtered.length} items</div>

          {error && <p className="text-red-400 text-center py-20">{error}</p>}

          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12">
              {[...Array(9)].map((_, i) => <div key={i} className="aspect-[4/5] bg-panel animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-24 text-center text-cream-dim">No products match your filters.</div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12">
              {filtered.map((p, i) => <ProductCard key={p.id} product={p} onQuickView={setQuickView} index={i} />)}
            </div>
          )}
        </div>
      </div>

      {filterOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black/70 z-[70] md:hidden" onClick={() => setFilterOpen(false)}>
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} transition={{ type: 'spring', damping: 28 }} onClick={e => e.stopPropagation()} className="absolute bottom-0 left-0 right-0 bg-panel border-t border-line p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-display text-lg">Filter &amp; Sort</h3>
              <button onClick={() => setFilterOpen(false)}><X size={20} className="text-cream-dim" /></button>
            </div>
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search products..." className="w-full bg-ink border border-line px-4 py-3 text-sm outline-none mb-6" />
            <h4 className="uppercase text-xs tracking-widest text-gold mb-3">Category</h4>
            <div className="grid grid-cols-2 gap-2 mb-6">
              {categories.map(c => (
                <button key={c.value} onClick={() => setCategory(c.value)} className={`text-left py-2 px-3 text-sm border rounded ${category === c.value ? 'border-gold text-gold' : 'border-line text-cream-dim'}`}>{c.label}</button>
              ))}
            </div>
            <h4 className="uppercase text-xs tracking-widest text-gold mb-3">Sort</h4>
            <div className="flex flex-col gap-2 mb-4">
              {SORTS.map(s => (
                <button key={s.value} onClick={() => setSort(s.value)} className={`text-left py-2 px-3 text-sm border rounded ${sort === s.value ? 'border-gold text-gold' : 'border-line text-cream-dim'}`}>{s.label}</button>
              ))}
            </div>
            <button onClick={() => setFilterOpen(false)} className="w-full bg-gold text-ink py-3 uppercase tracking-widest text-sm font-semibold">Apply</button>
          </motion.div>
        </motion.div>
      )}

      <QuickViewModal product={quickView} onClose={() => setQuickView(null)} />
    </div>
  );
}
