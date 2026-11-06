import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Truck, ShieldCheck, RotateCcw, Star } from 'lucide-react';
import type { Product } from '../lib/types';
import ProductCard from '../components/ProductCard';
import QuickViewModal from '../components/QuickViewModal';

const FALLBACK_CATEGORIES = [
  { name: 'Watches', slug: 'watches', image: '/products/watch-2.jpg' },
  { name: 'Shirts', slug: 'shirts', image: '/products/shirt-2.jpg' },
  { name: 'T-Shirts', slug: 'tshirts', image: '/products/tshirt-2.jpg' },
  { name: 'Outerwear', slug: 'outerwear', image: '/products/jacket-1.jpg' },
  { name: 'Accessories', slug: 'accessories', image: '/products/accessory-2.jpg' },
];

const TESTIMONIALS = [
  { name: 'Julien M.', role: 'Creative Director', text: 'The craftsmanship is unmatched. Every piece feels considered, from stitch to silhouette.' },
  { name: 'Amara K.', role: 'Architect', text: "Clotherapy has become my go-to for pieces that transition seamlessly from studio to dinner." },
  { name: 'Devon R.', role: 'Photographer', text: 'The watch collection alone is worth the visit — timeless design with modern engineering.' },
];

export default function Home() {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickView, setQuickView] = useState<Product | null>(null);
  const [categories, setCategories] = useState(FALLBACK_CATEGORIES);

  useEffect(() => {
    fetch('/api/admin-categories')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          // Only show top-level (parent) categories on home page
          const top = data.filter((c: any) => !c.parent_id);
          if (top.length > 0) setCategories(top);
        }
      })
      .catch(() => {});

    fetch('/api/products')
      .then(r => r.json())
      .then(data => setFeatured(Array.isArray(data) ? data.filter((p: Product) => p.is_featured).slice(0, 8) : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="overflow-x-hidden">
      {/* HERO */}
      <section className="relative min-h-screen flex items-end pt-20">
        <div className="absolute inset-0">
          <img src="/products/hero-main.jpg" alt="Clotherapy editorial" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-black/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink/80 via-transparent to-transparent" />
        </div>
        <div className="relative z-10 max-w-[1600px] mx-auto px-5 md:px-10 pb-24 w-full">
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-gold uppercase tracking-[0.35em] text-xs md:text-sm mb-6">Fall / Winter Collection</motion.p>
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.15 }} className="font-display text-5xl sm:text-6xl md:text-8xl leading-[0.95] max-w-3xl">
            Dress in <span className="italic text-gold-gradient">deliberate</span> style.
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }} className="text-cream-dim mt-6 max-w-md text-base md:text-lg">
            Watches, shirts, tees and accessories engineered for those who refuse the ordinary.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.45 }} className="flex flex-wrap gap-4 mt-10">
            <Link to="/shop" className="group inline-flex items-center gap-3 bg-gold text-ink px-8 py-4 uppercase tracking-widest text-sm font-semibold hover:bg-gold-bright transition-colors">
              Shop Collection <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/shop?category=watches" className="inline-flex items-center gap-3 border border-cream/30 px-8 py-4 uppercase tracking-widest text-sm font-semibold hover:border-gold hover:text-gold transition-colors">
              Explore Watches
            </Link>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 border-t border-line/50 bg-black/30 backdrop-blur-sm z-10">
          <div className="max-w-[1600px] mx-auto px-5 md:px-10 py-4 flex flex-wrap gap-x-10 gap-y-2 text-xs uppercase tracking-widest text-cream-dim">
            <span className="flex items-center gap-2"><Truck size={14} className="text-gold" /> Free worldwide shipping</span>
            <span className="flex items-center gap-2"><ShieldCheck size={14} className="text-gold" /> 2 year warranty</span>
            <span className="flex items-center gap-2"><RotateCcw size={14} className="text-gold" /> 30-day returns</span>
          </div>
        </div>
      </section>

      {/* BENTO SHOWCASE */}
      <section className="max-w-[1600px] mx-auto px-5 md:px-10 py-28">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-4">
          <div>
            <p className="text-gold uppercase tracking-[0.3em] text-xs mb-3">Signature Edit</p>
            <h2 className="font-display text-4xl md:text-5xl">Curated for every <span className="italic text-gold-gradient">occasion.</span></h2>
          </div>
          <Link to="/shop" className="text-sm uppercase tracking-widest text-cream-dim hover:text-gold flex items-center gap-2 transition-colors">View All <ArrowRight size={14} /></Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 md:h-[640px]">
          <motion.div initial={{ opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.7 }} className="relative md:col-span-2 md:row-span-2 group overflow-hidden">
            <img src="/products/hero-bento1.jpg" alt="Watches" className="w-full h-full object-cover min-h-[320px] transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
            <div className="absolute bottom-0 p-8">
              <p className="text-gold text-xs uppercase tracking-widest mb-2">Timepieces</p>
              <h3 className="font-display text-3xl mb-4">Precision Watches</h3>
              <Link to="/shop?category=watches" className="inline-flex items-center gap-2 text-sm uppercase tracking-widest border-b border-gold text-gold pb-1">Discover <ArrowRight size={14} /></Link>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.1 }} className="relative md:col-span-2 group overflow-hidden">
            <img src="/products/hero-bento2.jpg" alt="Shirts" className="w-full h-full object-cover min-h-[240px] transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
            <div className="absolute bottom-0 p-8">
              <p className="text-gold text-xs uppercase tracking-widest mb-2">Tailoring</p>
              <h3 className="font-display text-2xl mb-3">Shirts &amp; Tees</h3>
              <Link to="/shop?category=shirts" className="inline-flex items-center gap-2 text-sm uppercase tracking-widest border-b border-gold text-gold pb-1">Discover <ArrowRight size={14} /></Link>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.2 }} className="relative group overflow-hidden">
            <img src="/products/jacket-1.jpg" alt="Outerwear" className="w-full h-full object-cover min-h-[220px] transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
            <div className="absolute bottom-0 p-6">
              <h3 className="font-display text-xl mb-2">Outerwear</h3>
              <Link to="/shop?category=outerwear" className="inline-flex items-center gap-2 text-xs uppercase tracking-widest border-b border-gold text-gold pb-1">Shop <ArrowRight size={12} /></Link>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.3 }} className="relative group overflow-hidden">
            <img src="/products/hero-bento3.jpg" alt="Accessories" className="w-full h-full object-cover min-h-[220px] transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
            <div className="absolute bottom-0 p-6">
              <h3 className="font-display text-xl mb-2">Accessories</h3>
              <Link to="/shop?category=accessories" className="inline-flex items-center gap-2 text-xs uppercase tracking-widest border-b border-gold text-gold pb-1">Shop <ArrowRight size={12} /></Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* MARQUEE */}
      <section className="border-y border-line py-6 overflow-hidden bg-panel">
        <div className="flex whitespace-nowrap animate-marquee">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center gap-10 pr-10">
              {['Precision Craftsmanship', 'Free Global Shipping', 'Limited Drops', 'Sustainably Sourced', 'Lifetime Support'].map(t => (
                <span key={t} className="font-display text-2xl md:text-3xl text-cream-dim/40 flex items-center gap-10">{t} <span className="text-gold">✦</span></span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="max-w-[1600px] mx-auto px-5 md:px-10 py-28">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-4">
          <div>
            <p className="text-gold uppercase tracking-[0.3em] text-xs mb-3">Bestsellers</p>
            <h2 className="font-display text-4xl md:text-5xl">Most <span className="italic text-gold-gradient">coveted</span> pieces.</h2>
          </div>
          <Link to="/shop" className="text-sm uppercase tracking-widest text-cream-dim hover:text-gold flex items-center gap-2 transition-colors">View All <ArrowRight size={14} /></Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => <div key={i} className="aspect-[4/5] bg-panel animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-12">
            {featured.map((p, i) => <ProductCard key={p.id} product={p} onQuickView={setQuickView} index={i} />)}
          </div>
        )}
      </section>

      {/* LOOKBOOK BANNER */}
      <section className="relative h-[70vh] flex items-center overflow-hidden">
        <img src="/products/lookbook.jpg" alt="Lookbook" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/60 to-transparent" />
        <div className="relative z-10 max-w-[1600px] mx-auto px-5 md:px-10 w-full">
          <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="max-w-lg">
            <p className="text-gold uppercase tracking-[0.3em] text-xs mb-4">The Lookbook</p>
            <h2 className="font-display text-4xl md:text-6xl leading-tight mb-6">Every detail, <span className="italic text-gold-gradient">intentional.</span></h2>
            <p className="text-cream-dim mb-8">From hand-finished stitching to Swiss movement watches — explore the full autumn story.</p>
            <Link to="/shop" className="inline-flex items-center gap-3 bg-transparent border border-gold text-gold px-8 py-4 uppercase tracking-widest text-sm font-semibold hover:bg-gold hover:text-ink transition-colors">View Lookbook <ArrowRight size={16} /></Link>
          </motion.div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="max-w-[1600px] mx-auto px-5 md:px-10 py-28">
        <p className="text-gold uppercase tracking-[0.3em] text-xs mb-3 text-center">Testimonials</p>
        <h2 className="font-display text-4xl md:text-5xl text-center mb-16">Worn by <span className="italic text-gold-gradient">tastemakers.</span></h2>
        <div className="grid md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((t, i) => (
            <motion.div key={t.name} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: i * 0.1 }} className="bg-panel border border-line p-8">
              <div className="flex gap-1 text-gold mb-4">{[...Array(5)].map((_, j) => <Star key={j} size={14} fill="currentColor" />)}</div>
              <p className="text-cream-dim leading-relaxed mb-6">"{t.text}"</p>
              <p className="font-display text-cream">{t.name}</p>
              <p className="text-xs text-cream-dim/60 uppercase tracking-wider">{t.role}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CATEGORY STRIP — dynamic */}
      <section className="max-w-[1600px] mx-auto px-5 md:px-10 pb-28">
        <p className="text-gold uppercase tracking-[0.3em] text-xs mb-3 text-center">Explore</p>
        <h2 className="font-display text-4xl md:text-5xl text-center mb-14">Shop by <span className="italic text-gold-gradient">category.</span></h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {categories.slice(0, 10).map((c, i) => (
            <motion.div key={c.slug} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.08 }}>
              <Link to={`/shop?category=${c.slug}`} className="group block relative aspect-[3/4] overflow-hidden">
                <img src={c.image} alt={c.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
                <span className="absolute bottom-4 left-4 font-display text-lg text-cream">{c.name}</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      <QuickViewModal product={quickView} onClose={() => setQuickView(null)} />
    </div>
  );
}
