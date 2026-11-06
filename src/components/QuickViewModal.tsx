import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Product } from '../lib/types';
import { useCart } from '../context/CartContext';

interface Props {
  product: Product | null;
  onClose: () => void;
}

export default function QuickViewModal({ product, onClose }: Props) {
  const { addItem, openCart } = useCart();
  const [color, setColor] = useState('');
  const [size, setSize] = useState('');
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (product) {
      setColor(product.colors?.[0] || '');
      setSize(product.sizes?.[0] || '');
      setQty(1);
    }
  }, [product]);

  if (!product) return null;

  const handleAdd = () => {
    addItem({ productId: product.id, name: product.name, price: product.price, image: product.image, color, size, quantity: qty });
    onClose();
    openCart();
  };

  return (
    <AnimatePresence>
      {product && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[90]" />
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 20 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[95] flex items-center justify-center p-4"
          >
            <div className="bg-panel border border-line max-w-3xl w-full max-h-[90vh] overflow-y-auto grid md:grid-cols-2 relative">
              <button onClick={onClose} className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/50 flex items-center justify-center text-cream hover:text-gold"><X size={18} /></button>
              <div className="aspect-square md:aspect-auto md:h-full bg-panel-light">
                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
              </div>
              <div className="p-8 flex flex-col">
                <p className="text-[11px] uppercase tracking-[0.2em] text-gold mb-2">{product.category}</p>
                <h2 className="font-display text-3xl mb-2">{product.name}</h2>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl text-gold">₹{product.price.toLocaleString('en-IN')}</span>
                  {product.compare_price && <span className="text-cream-dim/50 line-through">₹{product.compare_price.toLocaleString('en-IN')}</span>}
                </div>
                <p className="text-cream-dim text-sm leading-relaxed mb-6">{product.description}</p>

                {product.colors?.length > 0 && (
                  <div className="mb-5">
                    <p className="text-xs uppercase tracking-wider text-cream-dim mb-2">Color: <span className="text-cream">{color}</span></p>
                    <div className="flex gap-2">
                      {product.colors.map(c => (
                        <button key={c} onClick={() => setColor(c)} className={`px-3 py-1.5 text-xs border rounded-full transition-colors ${color === c ? 'border-gold text-gold' : 'border-line text-cream-dim hover:border-cream-dim'}`}>{c}</button>
                      ))}
                    </div>
                  </div>
                )}

                {product.sizes?.length > 0 && (
                  <div className="mb-6">
                    <p className="text-xs uppercase tracking-wider text-cream-dim mb-2">Size</p>
                    <div className="flex gap-2 flex-wrap">
                      {product.sizes.map(s => (
                        <button key={s} onClick={() => setSize(s)} className={`w-11 h-11 border text-xs flex items-center justify-center transition-colors ${size === s ? 'border-gold text-gold bg-gold/10' : 'border-line text-cream-dim hover:border-cream-dim'}`}>{s}</button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center border border-line rounded-full">
                    <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-9 h-9 text-cream-dim hover:text-gold">-</button>
                    <span className="w-8 text-center">{qty}</span>
                    <button onClick={() => setQty(q => q + 1)} className="w-9 h-9 text-cream-dim hover:text-gold">+</button>
                  </div>
                </div>

                <div className="mt-auto flex flex-col gap-3">
                  <button onClick={handleAdd} className="bg-gold text-ink py-4 uppercase tracking-widest text-sm font-semibold hover:bg-gold-bright transition-colors">Add to Bag</button>
                  <Link to={`/product/${product.id}`} onClick={onClose} className="text-center text-cream-dim hover:text-gold text-sm underline underline-offset-4">View full details</Link>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
