import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Truck, ShieldCheck, RotateCcw, ChevronRight } from 'lucide-react';
import type { Product } from '../lib/types';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import ProductCard from '../components/ProductCard';
import QuickViewModal from '../components/QuickViewModal';

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImg, setActiveImg] = useState(0);
  const [color, setColor] = useState('');
  const [size, setSize] = useState('');
  const [qty, setQty] = useState(1);
  const [quickView, setQuickView] = useState<Product | null>(null);
  const { addItem, openCart } = useCart();
  const { has, toggle } = useWishlist();

  useEffect(() => {
    setLoading(true);
    setError('');
    setActiveImg(0);
    fetch(`/api/products?id=${id}`)
      .then(r => {
        if (!r.ok) throw new Error('Product not found');
        return r.json();
      })
      .then((data: Product) => {
        setProduct(data);
        setColor(data.colors?.[0] || '');
        setSize(data.sizes?.[0] || '');
        return fetch(`/api/products?category=${data.category}`).then(r => r.json());
      })
      .then((all: Product[]) => setRelated(Array.isArray(all) ? all.filter(p => p.id !== Number(id)).slice(0, 4) : []))
      .catch(() => setError('Product not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAdd = () => {
    if (!product) return;
    addItem({ productId: product.id, name: product.name, price: product.price, image: product.image, color, size, quantity: qty });
    openCart();
  };

  if (loading) {
    return <div className="pt-40 pb-24 max-w-[1600px] mx-auto px-5 md:px-10"><div className="grid md:grid-cols-2 gap-12"><div className="aspect-square bg-panel animate-pulse" /><div className="space-y-4"><div className="h-6 w-32 bg-panel animate-pulse" /><div className="h-10 w-2/3 bg-panel animate-pulse" /><div className="h-24 w-full bg-panel animate-pulse" /></div></div></div>;
  }

  if (error || !product) {
    return (
      <div className="pt-40 pb-24 text-center">
        <p className="text-cream-dim mb-4">{error || 'Product not found.'}</p>
        <Link to="/shop" className="text-gold underline underline-offset-4">Back to shop</Link>
      </div>
    );
  }

  const gallery = product.gallery?.length ? product.gallery : [product.image];
  const wished = has(product.id);

  return (
    <div className="pt-32 pb-24 max-w-[1600px] mx-auto px-5 md:px-10">
      <div className="flex items-center gap-2 text-xs text-cream-dim uppercase tracking-widest mb-10">
        <Link to="/" className="hover:text-gold">Home</Link><ChevronRight size={12} />
        <Link to="/shop" className="hover:text-gold">Shop</Link><ChevronRight size={12} />
        <span className="text-gold">{product.name}</span>
      </div>

      <div className="grid md:grid-cols-2 gap-12">
        <div>
          <motion.div key={activeImg} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }} className="aspect-square bg-panel overflow-hidden mb-4">
            <img src={gallery[activeImg]} alt={product.name} className="w-full h-full object-cover" />
          </motion.div>
          {gallery.length > 1 && (
            <div className="flex gap-3">
              {gallery.map((g, i) => (
                <button key={i} onClick={() => setActiveImg(i)} className={`w-20 h-20 overflow-hidden border-2 transition-colors ${activeImg === i ? 'border-gold' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                  <img src={g} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-gold uppercase tracking-[0.2em] text-xs mb-3">{product.category}</p>
          <h1 className="font-display text-4xl md:text-5xl mb-4">{product.name}</h1>
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl text-gold">₹{product.price.toLocaleString('en-IN')}</span>
            {product.compare_price && <span className="text-cream-dim/50 line-through text-lg">₹{product.compare_price.toLocaleString('en-IN')}</span>}
          </div>
          <p className="text-cream-dim leading-relaxed mb-8">{product.description}</p>

          {product.colors?.length > 0 && (
            <div className="mb-6">
              <p className="text-xs uppercase tracking-wider text-cream-dim mb-3">Color: <span className="text-cream">{color}</span></p>
              <div className="flex gap-2">
                {product.colors.map(c => (
                  <button key={c} onClick={() => setColor(c)} className={`px-4 py-2 text-xs border rounded-full transition-colors ${color === c ? 'border-gold text-gold bg-gold/10' : 'border-line text-cream-dim hover:border-cream-dim'}`}>{c}</button>
                ))}
              </div>
            </div>
          )}

          {product.sizes?.length > 0 && (
            <div className="mb-8">
              <p className="text-xs uppercase tracking-wider text-cream-dim mb-3">Size</p>
              <div className="flex gap-2 flex-wrap">
                {product.sizes.map(s => (
                  <button key={s} onClick={() => setSize(s)} className={`w-12 h-12 border text-xs flex items-center justify-center transition-colors ${size === s ? 'border-gold text-gold bg-gold/10' : 'border-line text-cream-dim hover:border-cream-dim'}`}>{s}</button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-4 mb-8">
            <div className="flex items-center border border-line rounded-full">
              <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-10 h-10 text-cream-dim hover:text-gold">-</button>
              <span className="w-10 text-center">{qty}</span>
              <button onClick={() => setQty(q => q + 1)} className="w-10 h-10 text-cream-dim hover:text-gold">+</button>
            </div>
            <button onClick={() => toggle(product.id)} className={`w-12 h-12 rounded-full border flex items-center justify-center transition-colors ${wished ? 'border-gold text-gold bg-gold/10' : 'border-line text-cream-dim hover:border-gold hover:text-gold'}`}>
              <Heart size={18} fill={wished ? 'currentColor' : 'none'} />
            </button>
          </div>

          <button onClick={handleAdd} className="w-full bg-gold text-ink py-4 uppercase tracking-widest text-sm font-semibold hover:bg-gold-bright transition-colors mb-8">Add to Bag — ₹{(product.price * qty).toLocaleString('en-IN')}</button>

          <div className="grid grid-cols-3 gap-4 border-t border-line pt-6 text-xs text-cream-dim">
            <div className="flex flex-col items-center text-center gap-2"><Truck size={18} className="text-gold" /> Free Shipping</div>
            <div className="flex flex-col items-center text-center gap-2"><ShieldCheck size={18} className="text-gold" /> 2Y Warranty</div>
            <div className="flex flex-col items-center text-center gap-2"><RotateCcw size={18} className="text-gold" /> 30D Returns</div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <div className="mt-28">
          <h2 className="font-display text-3xl mb-10">You may also <span className="italic text-gold-gradient">like.</span></h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-12">
            {related.map((p, i) => <ProductCard key={p.id} product={p} onQuickView={setQuickView} index={i} />)}
          </div>
        </div>
      )}
      <QuickViewModal product={quickView} onClose={() => setQuickView(null)} />
    </div>
  );
}
