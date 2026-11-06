import { AnimatePresence, motion } from 'framer-motion';
import { X, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, subtotal } = useCart();
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeCart} className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70]" />
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 280 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-panel border-l border-line z-[80] flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-line">
              <h2 className="font-display text-xl flex items-center gap-2"><ShoppingBag size={18} className="text-gold" /> Your Bag ({items.reduce((s, i) => s + i.quantity, 0)})</h2>
              <button onClick={closeCart} className="text-cream-dim hover:text-gold"><X size={22} /></button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              {items.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center gap-3 py-20">
                  <ShoppingBag size={40} className="text-cream-dim/40" />
                  <p className="text-cream-dim">Your bag is empty.</p>
                  <button onClick={() => { closeCart(); navigate('/shop'); }} className="mt-2 text-gold underline underline-offset-4 text-sm">Continue shopping</button>
                </div>
              )}
              {items.map(item => (
                <div key={`${item.productId}-${item.color}-${item.size}`} className="flex gap-4">
                  <img src={item.image} alt={item.name} className="w-24 h-28 object-cover bg-panel-light" />
                  <div className="flex-1 flex flex-col">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-display text-base text-cream">{item.name}</h4>
                        <p className="text-xs text-cream-dim mt-1">{item.color} / {item.size}</p>
                      </div>
                      <button onClick={() => removeItem(item.productId, item.color, item.size)} className="text-cream-dim hover:text-red-400"><Trash2 size={16} /></button>
                    </div>
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center border border-line rounded-full">
                        <button onClick={() => updateQuantity(item.productId, item.color, item.size, item.quantity - 1)} className="w-7 h-7 flex items-center justify-center text-cream-dim hover:text-gold"><Minus size={12} /></button>
                        <span className="w-6 text-center text-sm">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.productId, item.color, item.size, item.quantity + 1)} className="w-7 h-7 flex items-center justify-center text-cream-dim hover:text-gold"><Plus size={12} /></button>
                      </div>
                      <span className="text-gold font-medium">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {items.length > 0 && (
              <div className="border-t border-line px-6 py-6 space-y-4">
                <div className="flex justify-between text-sm text-cream-dim">
                  <span>Subtotal</span>
                  <span className="text-cream font-medium">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <p className="text-xs text-cream-dim/70">Shipping and taxes calculated at checkout.</p>
                <button onClick={() => { closeCart(); navigate('/checkout'); }} className="w-full bg-gold text-ink py-4 uppercase tracking-widest text-sm font-semibold hover:bg-gold-bright transition-colors">
                  Checkout
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
