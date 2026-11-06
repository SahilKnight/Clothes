import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import type { Product } from '../lib/types';
import { useWishlist } from '../context/WishlistContext';
import ProductCard from '../components/ProductCard';
import QuickViewModal from '../components/QuickViewModal';

export default function Wishlist() {
  const { ids } = useWishlist();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickView, setQuickView] = useState<Product | null>(null);

  useEffect(() => {
    fetch('/api/products')
      .then(r => r.json())
      .then(data => setProducts(Array.isArray(data) ? data.filter((p: Product) => ids.includes(p.id)) : []))
      .finally(() => setLoading(false));
  }, [ids]);

  return (
    <div className="pt-32 pb-24 max-w-[1600px] mx-auto px-5 md:px-10 min-h-[60vh]">
      <div className="mb-14">
        <p className="text-gold uppercase tracking-[0.3em] text-xs mb-3">Saved for later</p>
        <h1 className="font-display text-4xl md:text-6xl">Your <span className="italic text-gold-gradient">Wishlist.</span></h1>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
          {[...Array(4)].map((_, i) => <div key={i} className="aspect-[4/5] bg-panel animate-pulse" />)}
        </div>
      ) : products.length === 0 ? (
        <div className="py-24 flex flex-col items-center text-center gap-4">
          <Heart size={40} className="text-cream-dim/40" />
          <p className="text-cream-dim">Your wishlist is empty.</p>
          <Link to="/shop" className="text-gold underline underline-offset-4 text-sm">Browse the collection</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
          {products.map((p, i) => <ProductCard key={p.id} product={p} onQuickView={setQuickView} index={i} />)}
        </div>
      )}
      <QuickViewModal product={quickView} onClose={() => setQuickView(null)} />
    </div>
  );
}
