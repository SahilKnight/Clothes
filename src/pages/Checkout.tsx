import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ShieldCheck } from 'lucide-react';
import { useCart } from '../context/CartContext';

declare global {
  interface Window {
    Razorpay: any;
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise(resolve => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', city: '', zip: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState('');
  const [scriptReady, setScriptReady] = useState(false);

  useEffect(() => {
    loadRazorpayScript().then(setScriptReady);
  }, []);

  const shipping = subtotal > 15000 || subtotal === 0 ? 0 : 199;
  const total = subtotal + shipping;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Full name is required.';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) e.email = 'Valid email is required.';
    if (!/^\d{10}$/.test(form.phone.replace(/\D/g, ''))) e.phone = 'Valid 10-digit phone number required.';
    if (!form.address.trim()) e.address = 'Address is required.';
    if (!form.city.trim()) e.city = 'City is required.';
    if (!/^\d{6}$/.test(form.zip)) e.zip = 'Valid 6-digit PIN code required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const placeOrder = async (paymentInfo: { razorpay_order_id?: string; razorpay_payment_id?: string; razorpay_signature?: string } = {}) => {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items,
        total,
        name: form.name,
        email: form.email,
        address: `${form.address}, ${form.city} ${form.zip} · Ph: ${form.phone}`,
        ...paymentInfo,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Order failed');
    return data;
  };

  const handlePayment = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setApiError('');
    if (!validate()) return;
    if (items.length === 0) { setApiError('Your bag is empty.'); return; }

    setSubmitting(true);
    try {
      const orderRes = await fetch('/api/razorpay-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: total }),
      });
      const orderData = await orderRes.json();

      if (!orderRes.ok) {
        throw new Error(orderData.error || 'Could not initiate payment.');
      }

      if (orderData.demo) {
        // Razorpay keys not configured — record order in demo mode.
        await placeOrder();
        setSuccess(true);
        clearCart();
        setSubmitting(false);
        return;
      }

      if (!scriptReady || !window.Razorpay) {
        throw new Error('Payment gateway failed to load. Please refresh and try again.');
      }

      const rzp = new window.Razorpay({
        key: orderData.keyId,
        amount: orderData.amount,
        currency: 'INR',
        name: 'Clotherapy',
        description: 'Order Payment',
        order_id: orderData.id,
        prefill: { name: form.name, email: form.email, contact: form.phone },
        theme: { color: '#c9a24b' },
        handler: async (response: any) => {
          try {
            const verifyRes = await fetch('/api/razorpay-verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                amount: total,
              }),
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok || !verifyData.verified) throw new Error('Payment verification failed.');

            await placeOrder({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            setSuccess(true);
            clearCart();
          } catch (err: any) {
            setApiError(err.message || 'Payment verification failed.');
          } finally {
            setSubmitting(false);
          }
        },
        modal: {
          ondismiss: () => setSubmitting(false),
        },
      });
      rzp.on('payment.failed', (resp: any) => {
        setApiError(resp.error?.description || 'Payment failed. Please try again.');
        setSubmitting(false);
      });
      rzp.open();
    } catch (err: any) {
      setApiError(err.message);
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="pt-40 pb-32 max-w-lg mx-auto px-5 text-center">
        <CheckCircle2 size={56} className="text-gold mx-auto mb-6" />
        <h1 className="font-display text-4xl mb-4">Order Confirmed</h1>
        <p className="text-cream-dim mb-8">Thank you for shopping with Clotherapy. Your order has been recorded and our team will reach out to <span className="text-gold">{form.email}</span> with tracking details shortly. Your pieces are being prepared with care.</p>
        <button onClick={() => navigate('/shop')} className="bg-gold text-ink px-8 py-4 uppercase tracking-widest text-sm font-semibold hover:bg-gold-bright transition-colors">Continue Shopping</button>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-24 max-w-[1200px] mx-auto px-5 md:px-10">
      <h1 className="font-display text-4xl md:text-5xl mb-14">Checkout</h1>
      <div className="grid lg:grid-cols-[1.3fr_1fr] gap-14">
        <form onSubmit={handlePayment} className="space-y-6">
          <div>
            <h2 className="uppercase text-xs tracking-widest text-gold mb-4">Contact &amp; Shipping</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <input placeholder="Full Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full bg-panel border border-line focus:border-gold px-4 py-3 text-sm outline-none" />
                {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
              </div>
              <div>
                <input placeholder="Email Address" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full bg-panel border border-line focus:border-gold px-4 py-3 text-sm outline-none" />
                {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
              </div>
            </div>
            <div className="mt-4">
              <input placeholder="Phone Number" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full bg-panel border border-line focus:border-gold px-4 py-3 text-sm outline-none" />
              {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
            </div>
            <div className="mt-4">
              <input placeholder="Street Address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="w-full bg-panel border border-line focus:border-gold px-4 py-3 text-sm outline-none" />
              {errors.address && <p className="text-red-400 text-xs mt-1">{errors.address}</p>}
            </div>
            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              <div>
                <input placeholder="City" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="w-full bg-panel border border-line focus:border-gold px-4 py-3 text-sm outline-none" />
                {errors.city && <p className="text-red-400 text-xs mt-1">{errors.city}</p>}
              </div>
              <div>
                <input placeholder="PIN Code" value={form.zip} onChange={e => setForm({ ...form, zip: e.target.value })} className="w-full bg-panel border border-line focus:border-gold px-4 py-3 text-sm outline-none" />
                {errors.zip && <p className="text-red-400 text-xs mt-1">{errors.zip}</p>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-cream-dim bg-panel border border-line p-4">
            <ShieldCheck size={16} className="text-gold shrink-0" /> Payments are securely processed by Razorpay. Your card and banking details are never stored on our servers.
          </div>

          {apiError && <p className="text-red-400 text-sm">{apiError}</p>}

          <button disabled={submitting} className="w-full bg-gold text-ink py-4 uppercase tracking-widest text-sm font-semibold hover:bg-gold-bright transition-colors disabled:opacity-60">
            {submitting ? 'Processing...' : `Pay ₹${total.toLocaleString('en-IN')}`}
          </button>
        </form>

        <div className="bg-panel border border-line p-6 h-fit">
          <h2 className="font-display text-xl mb-6">Order Summary</h2>
          <div className="space-y-4 max-h-80 overflow-y-auto mb-6">
            {items.map(item => (
              <div key={`${item.productId}-${item.color}-${item.size}`} className="flex gap-3">
                <img src={item.image} alt={item.name} className="w-16 h-20 object-cover bg-panel-light" />
                <div className="flex-1">
                  <p className="text-sm text-cream">{item.name}</p>
                  <p className="text-xs text-cream-dim">{item.color} / {item.size} × {item.quantity}</p>
                </div>
                <span className="text-sm text-gold">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
              </div>
            ))}
            {items.length === 0 && <p className="text-cream-dim text-sm">Your bag is empty.</p>}
          </div>
          <div className="border-t border-line pt-4 space-y-2 text-sm">
            <div className="flex justify-between text-cream-dim"><span>Subtotal</span><span>₹{subtotal.toLocaleString('en-IN')}</span></div>
            <div className="flex justify-between text-cream-dim"><span>Shipping</span><span>{shipping === 0 ? 'Free' : `₹${shipping}`}</span></div>
            <div className="flex justify-between text-lg font-medium text-cream pt-2 border-t border-line"><span>Total</span><span className="text-gold">₹{total.toLocaleString('en-IN')}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
