import { Link } from 'react-router-dom';
import { Heart, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Product } from '../lib/types';
import { useWishlist } from '../context/WishlistContext';

interface Props {
  product: Product;
  onQuickView: (p: Product) => void;
  index?: number;
}

export default function ProductCard({ product, onQuickView, index = 0 }: Props) {
  const { has, toggle } = useWishlist();
  const wished = has(product.id);
  const hoverImg = product.gallery?.[1] || product.image;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay: (index % 8) * 0.06 }}
      className="group relative"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-panel">
        <Link to={`/product/${product.id}`}>
          <img src={product.image} alt={product.name} className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500 group-hover:opacity-0" />
          <img src={hoverImg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100 scale-105" />
        </Link>
        {product.is_new && (
          <span className="absolute top-3 left-3 bg-gold text-ink text-[10px] font-bold uppercase tracking-widest px-2.5 py-1">New</span>
        )}
        <button
          onClick={() => toggle(product.id)}
          className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md transition-colors ${wished ? 'bg-gold text-ink' : 'bg-black/40 text-cream hover:bg-black/60'}`}
          aria-label="Toggle wishlist"
        >
          <Heart size={15} fill={wished ? 'currentColor' : 'none'} />
        </button>

        <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-400 ease-out">
          <button
            onClick={() => onQuickView(product)}
            className="w-full bg-cream text-ink py-3 flex items-center justify-center gap-2 text-xs uppercase tracking-widest font-semibold hover:bg-gold transition-colors"
          >
            <Eye size={14} /> Quick View
          </button>
        </div>
      </div>
      <Link to={`/product/${product.id}`} className="block mt-4">
        <p className="text-[11px] uppercase tracking-[0.15em] text-gold mb-1">{product.category}</p>
        <h3 className="font-display text-lg text-cream group-hover:text-gold transition-colors">{product.name}</h3>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-cream-dim">₹{product.price.toLocaleString('en-IN')}</span>
          {product.compare_price && <span className="text-cream-dim/50 line-through text-sm">₹{product.compare_price.toLocaleString('en-IN')}</span>}
        </div>
      </Link>
    </motion.div>
  );
}
