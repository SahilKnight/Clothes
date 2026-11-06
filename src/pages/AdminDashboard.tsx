import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, X, LogOut, Package, ShoppingCart, Mail, Upload, Star, Sparkles, Tag, Image, ChevronRight } from 'lucide-react';
import supabase from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { Product } from '../lib/types';

interface Category { id: number; name: string; slug: string; image: string; parent_id: number | null; }
interface OrderRow { id: number; items: any[]; total: number; name: string; email: string; address: string; created_at: string; }
interface SubRow { id: number; email: string; created_at: string; }

const TABS = [
  { key: 'products', label: 'Products', icon: Package },
  { key: 'categories', label: 'Categories', icon: Tag },
  { key: 'orders', label: 'Orders', icon: ShoppingCart },
  { key: 'newsletter', label: 'Subscribers', icon: Mail },
] as const;
type TabKey = typeof TABS[number]['key'];

const emptyProduct = { id: 0, name: '', category: '', price: '', compare_price: '', description: '', images: [] as string[], colors: '', sizes: '', is_new: false, is_featured: false, rating: '4.5' };
const emptyCat = { id: 0, name: '', image: '', parent_id: null as number | null };

export default function AdminDashboard() {
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabKey>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [subs, setSubs] = useState<SubRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [productModal, setProductModal] = useState(false);
  const [catModal, setCatModal] = useState(false);
  const [form, setForm] = useState(emptyProduct);
  const [catForm, setCatForm] = useState(emptyCat);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'product' | 'category'; id: number; name: string } | null>(null);

  const authHeaders = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` });

  const fetchAll = async () => {
    setLoading(true); setError('');
    try {
      const [pr, cr, or, sr] = await Promise.all([
        fetch('/api/admin-products', { headers: authHeaders() }).then(r => r.json()),
        fetch('/api/admin-categories').then(r => r.json()),
        fetch('/api/admin-orders', { headers: authHeaders() }).then(r => r.json()),
        fetch('/api/admin-newsletter', { headers: authHeaders() }).then(r => r.json()),
      ]);
      if (Array.isArray(pr)) setProducts(pr); else setError(pr.error || 'Failed to load products.');
      if (Array.isArray(cr)) setCategories(cr);
      if (Array.isArray(or)) setOrders(or);
      if (Array.isArray(sr)) setSubs(sr);
    } finally { setLoading(false); }
  };

  useEffect(() => { if (session) fetchAll(); }, [session]);

  const uploadImage = async (file: File): Promise<string> => {
    const reader = new FileReader();
    const base64: string = await new Promise((res, rej) => {
      reader.onload = () => res((reader.result as string).split(',')[1]);
      reader.onerror = rej; reader.readAsDataURL(file);
    });
    const r = await fetch('/api/admin-upload', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ fileName: file.name, fileBase64: base64, contentType: file.type }) });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || 'Upload failed');
    return d.url;
  };

  const handleProductImages = async (files: FileList) => {
    setUploading(true); setFormError('');
    try { const urls = await Promise.all(Array.from(files).map(uploadImage)); setForm(f => ({ ...f, images: [...f.images, ...urls] })); }
    catch (e: any) { setFormError(e.message); } finally { setUploading(false); }
  };

  const handleCatImage = async (file: File) => {
    setUploading(true);
    try { const url = await uploadImage(file); setCatForm(f => ({ ...f, image: url })); }
    catch (e: any) { setFormError(e.message); } finally { setUploading(false); }
  };

  const saveProduct = async (e: React.FormEvent) => {
    e.preventDefault(); setFormError('');
    if (!form.name.trim() || !form.category || !form.price || form.images.length === 0) { setFormError('Name, category, price and at least one image are required.'); return; }
    setSaving(true);
    try {
      const payload = { id: form.id || undefined, name: form.name.trim(), category: form.category, price: Number(form.price), compare_price: form.compare_price ? Number(form.compare_price) : null, description: form.description, image: form.images[0], gallery: form.images, colors: form.colors ? form.colors.split(',').map(s => s.trim()).filter(Boolean) : [], sizes: form.sizes ? form.sizes.split(',').map(s => s.trim()).filter(Boolean) : [], is_new: form.is_new, is_featured: form.is_featured, rating: Number(form.rating) || 4.5 };
      const r = await fetch('/api/admin-products', { method: form.id ? 'PUT' : 'POST', headers: authHeaders(), body: JSON.stringify(payload) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Save failed');
      setProductModal(false); fetchAll();
    } catch (e: any) { setFormError(e.message); } finally { setSaving(false); }
  };

  const saveCat = async (e: React.FormEvent) => {
    e.preventDefault(); setFormError('');
    if (!catForm.name.trim() || !catForm.image) { setFormError('Name and image are required.'); return; }
    setSaving(true);
    try {
      const r = await fetch('/api/admin-categories', { method: catForm.id ? 'PUT' : 'POST', headers: authHeaders(), body: JSON.stringify(catForm) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Save failed');
      setCatModal(false); fetchAll();
    } catch (e: any) { setFormError(e.message); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const url = deleteTarget.type === 'product' ? '/api/admin-products' : '/api/admin-categories';
      const r = await fetch(url, { method: 'DELETE', headers: authHeaders(), body: JSON.stringify({ id: deleteTarget.id }) });
      if (!r.ok) { const d = await r.json(); throw new Error(d.error || 'Delete failed'); }
      setDeleteTarget(null); fetchAll();
    } catch (e: any) { setError(e.message); setDeleteTarget(null); }
  };

  const openEditProduct = (p: Product) => {
    setForm({ id: p.id, name: p.name, category: p.category, price: String(p.price), compare_price: p.compare_price ? String(p.compare_price) : '', description: p.description || '', images: p.gallery?.length ? p.gallery : [p.image], colors: (p.colors || []).join(', '), sizes: (p.sizes || []).join(', '), is_new: !!p.is_new, is_featured: !!p.is_featured, rating: String(p.rating || 4.5) });
    setFormError(''); setProductModal(true);
  };

  const openEditCat = (c: Category) => { setCatForm({ id: c.id, name: c.name, image: c.image, parent_id: c.parent_id }); setFormError(''); setCatModal(true); };

  // Build hierarchical category options for product form
  const parentCats = categories.filter(c => !c.parent_id);
  const childCats = (pid: number) => categories.filter(c => c.parent_id === pid);

  const inp = 'bg-ink border border-line focus:border-gold px-4 py-3 text-sm outline-none w-full';

  return (
    <div className="min-h-screen bg-ink pt-28 pb-20">
      <div className="max-w-[1400px] mx-auto px-5 md:px-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <p className="text-gold uppercase tracking-[0.25em] text-xs mb-2 flex items-center gap-2"><Sparkles size={12} /> Admin Dashboard</p>
            <h1 className="font-display text-3xl md:text-4xl">Welcome, <span className="italic text-gold-gradient">{user?.email}</span></h1>
          </div>
          <button onClick={async () => { await supabase.auth.signOut(); navigate('/admin/login'); }} className="flex items-center gap-2 border border-line px-5 py-3 text-sm uppercase tracking-widest hover:border-gold hover:text-gold transition-colors w-fit">
            <LogOut size={15} /> Sign Out
          </button>
        </div>

        <div className="flex gap-2 mb-10 border-b border-line overflow-x-auto no-scrollbar">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} className={`flex items-center gap-2 px-5 py-3 text-sm uppercase tracking-widest border-b-2 transition-colors whitespace-nowrap ${tab === t.key ? 'border-gold text-gold' : 'border-transparent text-cream-dim hover:text-cream'}`}>
              <t.icon size={15} /> {t.label}
              {t.key === 'products' && <span className="ml-1 text-xs bg-panel-light px-2 py-0.5 rounded-full">{products.length}</span>}
              {t.key === 'categories' && <span className="ml-1 text-xs bg-panel-light px-2 py-0.5 rounded-full">{categories.length}</span>}
              {t.key === 'orders' && <span className="ml-1 text-xs bg-panel-light px-2 py-0.5 rounded-full">{orders.length}</span>}
              {t.key === 'newsletter' && <span className="ml-1 text-xs bg-panel-light px-2 py-0.5 rounded-full">{subs.length}</span>}
            </button>
          ))}
        </div>

        {error && <p className="text-red-400 text-sm mb-6">{error}</p>}

        {loading ? (
          <div className="py-24 flex justify-center"><div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" /></div>
        ) : tab === 'products' ? (
          <div>
            <div className="flex justify-end mb-6">
              <button onClick={() => { setForm(emptyProduct); setFormError(''); setProductModal(true); }} className="flex items-center gap-2 bg-gold text-ink px-5 py-3 text-sm uppercase tracking-widest font-semibold hover:bg-gold-bright transition-colors"><Plus size={16} /> Add Product</button>
            </div>
            <div className="overflow-x-auto border border-line">
              <table className="w-full text-sm">
                <thead><tr className="bg-panel-light text-left text-cream-dim uppercase text-xs tracking-wider"><th className="p-4">Image</th><th className="p-4">Name</th><th className="p-4">Category</th><th className="p-4">Price</th><th className="p-4">Flags</th><th className="p-4 text-right">Actions</th></tr></thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id} className="border-t border-line hover:bg-panel-light/50 transition-colors">
                      <td className="p-4"><img src={p.image} alt={p.name} className="w-12 h-14 object-cover bg-panel-light" /></td>
                      <td className="p-4 text-cream">{p.name}</td>
                      <td className="p-4 text-cream-dim capitalize">{p.category}</td>
                      <td className="p-4 text-gold">₹{p.price}{p.compare_price ? <span className="text-cream-dim/50 line-through ml-2 text-xs">₹{p.compare_price}</span> : null}</td>
                      <td className="p-4"><div className="flex gap-1">{p.is_new && <span className="text-[10px] bg-gold/10 text-gold px-2 py-1 rounded-full">New</span>}{p.is_featured && <span className="text-[10px] bg-gold/10 text-gold px-2 py-1 rounded-full flex items-center gap-1"><Star size={9} fill="currentColor" />Featured</span>}</div></td>
                      <td className="p-4"><div className="flex justify-end gap-3"><button onClick={() => openEditProduct(p)} className="text-cream-dim hover:text-gold"><Pencil size={16} /></button><button onClick={() => setDeleteTarget({ type: 'product', id: p.id, name: p.name })} className="text-cream-dim hover:text-red-400"><Trash2 size={16} /></button></div></td>
                    </tr>
                  ))}
                  {products.length === 0 && <tr><td colSpan={6} className="p-10 text-center text-cream-dim">No products yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        ) : tab === 'categories' ? (
          <div>
            <div className="flex items-center justify-between mb-6">
              <p className="text-cream-dim text-sm">Parent categories are top-level (e.g. Outerwear). Sub-categories belong under a parent (e.g. Shirts under Outerwear).</p>
              <button onClick={() => { setCatForm(emptyCat); setFormError(''); setCatModal(true); }} className="flex items-center gap-2 bg-gold text-ink px-5 py-3 text-sm uppercase tracking-widest font-semibold hover:bg-gold-bright transition-colors shrink-0 ml-4"><Plus size={16} /> Add Category</button>
            </div>
            <div className="space-y-6">
              {parentCats.map(parent => (
                <div key={parent.id} className="border border-line">
                  <div className="flex items-center gap-4 p-4 bg-panel-light">
                    <img src={parent.image} alt={parent.name} className="w-14 h-14 object-cover" />
                    <div className="flex-1">
                      <p className="text-cream font-medium capitalize text-lg">{parent.name}</p>
                      <p className="text-xs text-cream-dim">{parent.slug} · Parent category</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => openEditCat(parent)} className="text-cream-dim hover:text-gold p-2"><Pencil size={15} /></button>
                      <button onClick={() => setDeleteTarget({ type: 'category', id: parent.id, name: parent.name })} className="text-cream-dim hover:text-red-400 p-2"><Trash2 size={15} /></button>
                    </div>
                  </div>
                  {childCats(parent.id).length > 0 && (
                    <div className="divide-y divide-line">
                      {childCats(parent.id).map(child => (
                        <div key={child.id} className="flex items-center gap-4 p-4 pl-10">
                          <ChevronRight size={14} className="text-gold shrink-0" />
                          <img src={child.image} alt={child.name} className="w-10 h-10 object-cover" />
                          <div className="flex-1">
                            <p className="text-cream capitalize">{child.name}</p>
                            <p className="text-xs text-cream-dim">{child.slug}</p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => openEditCat(child)} className="text-cream-dim hover:text-gold p-2"><Pencil size={14} /></button>
                            <button onClick={() => setDeleteTarget({ type: 'category', id: child.id, name: child.name })} className="text-cream-dim hover:text-red-400 p-2"><Trash2 size={14} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="p-3 border-t border-line">
                    <button onClick={() => { setCatForm({ ...emptyCat, parent_id: parent.id }); setFormError(''); setCatModal(true); }} className="flex items-center gap-2 text-xs text-gold hover:text-gold-bright transition-colors"><Plus size={12} /> Add sub-category under {parent.name}</button>
                  </div>
                </div>
              ))}
              {parentCats.length === 0 && <p className="text-center text-cream-dim py-20">No categories yet. Add your first parent category.</p>}
            </div>
          </div>
        ) : tab === 'orders' ? (
          <div className="space-y-4">
            {orders.length === 0 && <p className="text-cream-dim text-center py-20">No orders yet.</p>}
            {orders.map(o => (
              <div key={o.id} className="bg-panel border border-line p-6">
                <div className="flex flex-wrap justify-between gap-4 mb-4">
                  <div><p className="font-display text-lg text-cream">Order #{o.id}</p><p className="text-xs text-cream-dim">{new Date(o.created_at).toLocaleString()}</p></div>
                  <div className="text-right"><p className="text-gold text-lg">₹{o.total}</p><p className="text-xs text-cream-dim">{o.name} · {o.email}</p></div>
                </div>
                <p className="text-xs text-cream-dim mb-4">{o.address}</p>
                <div className="flex flex-wrap gap-3">{(o.items || []).map((it: any, i: number) => (<div key={i} className="flex items-center gap-2 bg-panel-light px-3 py-2 text-xs text-cream-dim"><img src={it.image} alt={it.name} className="w-8 h-10 object-cover" /><span>{it.name} · {it.color}/{it.size} × {it.quantity}</span></div>))}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-line overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-panel-light text-left text-cream-dim uppercase text-xs tracking-wider"><th className="p-4">Email</th><th className="p-4">Subscribed</th></tr></thead>
              <tbody>
                {subs.map(s => (<tr key={s.id} className="border-t border-line"><td className="p-4 text-cream">{s.email}</td><td className="p-4 text-cream-dim">{new Date(s.created_at).toLocaleDateString()}</td></tr>))}
                {subs.length === 0 && <tr><td colSpan={2} className="p-10 text-center text-cream-dim">No subscribers yet.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AnimatePresence>
        {productModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setProductModal(false)} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[90]" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="fixed inset-0 z-[95] flex items-center justify-center p-4">
              <div className="bg-panel border border-line max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 relative">
                <button onClick={() => setProductModal(false)} className="absolute top-6 right-6 text-cream-dim hover:text-gold"><X size={20} /></button>
                <h2 className="font-display text-2xl mb-6">{form.id ? 'Edit Product' : 'Add New Product'}</h2>
                <form onSubmit={saveProduct} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <input placeholder="Product Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inp} />
                    <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className={inp}>
                      <option value="">Select Category</option>
                      {parentCats.map(parent => (
                        <optgroup key={parent.id} label={parent.name}>
                          <option value={parent.slug}>{parent.name} (all)</option>
                          {childCats(parent.id).map(child => (
                            <option key={child.id} value={child.slug}>&nbsp;&nbsp;↳ {child.name}</option>
                          ))}
                        </optgroup>
                      ))}
                      {categories.filter(c => !c.parent_id && !parentCats.find(p => p.id === c.id)).map(c => (
                        <option key={c.id} value={c.slug}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <input type="number" step="0.01" placeholder="Price (₹)" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className={inp} />
                    <input type="number" step="0.01" placeholder="Compare-at Price (optional)" value={form.compare_price} onChange={e => setForm({ ...form, compare_price: e.target.value })} className={inp} />
                  </div>
                  <textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className={`${inp} resize-none`} />
                  <div>
                    <p className="text-xs uppercase tracking-wider text-cream-dim mb-2">Product Images — upload as many as you want</p>
                    <label className="flex items-center justify-center gap-2 border border-dashed border-line hover:border-gold cursor-pointer py-4 text-sm text-cream-dim hover:text-gold transition-colors">
                      <Upload size={15} /> {uploading ? 'Uploading...' : 'Upload Images (select multiple)'}
                      <input type="file" accept="image/*" multiple hidden onChange={e => e.target.files && handleProductImages(e.target.files)} />
                    </label>
                    {form.images.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {form.images.map((url, i) => (
                          <div key={i} className="relative group">
                            <img src={url} alt="" className="w-16 h-20 object-cover bg-panel-light" />
                            {i === 0 && <span className="absolute top-0 left-0 bg-gold text-ink text-[9px] px-1">Main</span>}
                            <button type="button" onClick={() => setForm(f => ({ ...f, images: f.images.filter((_, j) => j !== i) }))} className="absolute top-0 right-0 bg-red-500 text-white p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"><X size={10} /></button>
                          </div>
                        ))}
                      </div>
                    )}
                    <input placeholder="Or paste image URL and press Enter" className={`${inp} mt-3`} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); const v = (e.target as HTMLInputElement).value.trim(); if (v) { setForm(f => ({ ...f, images: [...f.images, v] })); (e.target as HTMLInputElement).value = ''; } } }} />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <input placeholder="Colors, comma separated" value={form.colors} onChange={e => setForm({ ...form, colors: e.target.value })} className={inp} />
                    <input placeholder="Sizes, comma separated" value={form.sizes} onChange={e => setForm({ ...form, sizes: e.target.value })} className={inp} />
                  </div>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 text-sm text-cream-dim cursor-pointer"><input type="checkbox" checked={form.is_new} onChange={e => setForm({ ...form, is_new: e.target.checked })} className="accent-yellow-600" /> Mark as New</label>
                    <label className="flex items-center gap-2 text-sm text-cream-dim cursor-pointer"><input type="checkbox" checked={form.is_featured} onChange={e => setForm({ ...form, is_featured: e.target.checked })} className="accent-yellow-600" /> Featured on Home</label>
                  </div>
                  {formError && <p className="text-red-400 text-sm">{formError}</p>}
                  <button disabled={saving || uploading} className="w-full bg-gold text-ink py-4 uppercase tracking-widest text-sm font-semibold hover:bg-gold-bright transition-colors disabled:opacity-60">{saving ? 'Saving...' : form.id ? 'Save Changes' : 'Create Product'}</button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {catModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setCatModal(false)} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[90]" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="fixed inset-0 z-[95] flex items-center justify-center p-4">
              <div className="bg-panel border border-line max-w-md w-full p-8 relative">
                <button onClick={() => setCatModal(false)} className="absolute top-6 right-6 text-cream-dim hover:text-gold"><X size={20} /></button>
                <h2 className="font-display text-2xl mb-1">{catForm.id ? 'Edit Category' : 'Add Category'}</h2>
                <p className="text-cream-dim text-xs mb-6">Leave "Parent Category" empty to create a top-level category (e.g. Outerwear). Select a parent to create a sub-category (e.g. Shirts under Outerwear).</p>
                <form onSubmit={saveCat} className="space-y-4">
                  <input placeholder="Category Name (e.g. Shoes)" value={catForm.name} onChange={e => setCatForm({ ...catForm, name: e.target.value })} className={inp} />
                  <select value={catForm.parent_id ?? ''} onChange={e => setCatForm({ ...catForm, parent_id: e.target.value ? Number(e.target.value) : null })} className={inp}>
                    <option value="">No parent — top-level category</option>
                    {parentCats.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-cream-dim mb-2">Background Image</p>
                    {catForm.image && <img src={catForm.image} alt="" className="w-full h-32 object-cover mb-3" />}
                    <label className="flex items-center justify-center gap-2 border border-dashed border-line hover:border-gold cursor-pointer py-4 text-sm text-cream-dim hover:text-gold transition-colors">
                      <Image size={15} /> {uploading ? 'Uploading...' : 'Upload Background Image'}
                      <input type="file" accept="image/*" hidden onChange={e => e.target.files?.[0] && handleCatImage(e.target.files[0])} />
                    </label>
                    <input placeholder="Or paste image URL" value={catForm.image} onChange={e => setCatForm({ ...catForm, image: e.target.value })} className={`${inp} mt-3`} />
                  </div>
                  {formError && <p className="text-red-400 text-sm">{formError}</p>}
                  <button disabled={saving || uploading} className="w-full bg-gold text-ink py-4 uppercase tracking-widest text-sm font-semibold hover:bg-gold-bright transition-colors disabled:opacity-60">{saving ? 'Saving...' : catForm.id ? 'Save Changes' : 'Create Category'}</button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteTarget && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeleteTarget(null)} className="fixed inset-0 bg-black/80 z-[90]" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed inset-0 z-[95] flex items-center justify-center p-4">
              <div className="bg-panel border border-line p-8 max-w-sm w-full text-center">
                <h3 className="font-display text-xl mb-3">Delete "{deleteTarget.name}"?</h3>
                <p className="text-cream-dim text-sm mb-6">This action cannot be undone.</p>
                <div className="flex gap-3">
                  <button onClick={() => setDeleteTarget(null)} className="flex-1 border border-line py-3 text-sm uppercase tracking-widest hover:border-cream-dim transition-colors">Cancel</button>
                  <button onClick={handleDelete} className="flex-1 bg-red-500/90 text-white py-3 text-sm uppercase tracking-widest hover:bg-red-500 transition-colors">Delete</button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
