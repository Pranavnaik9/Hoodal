import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../lib/api';
import { Category } from '../types';

export function AdminProductFormPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const isEdit = !!id;
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        name: '', description: '', categoryId: '', price: '', costPrice: '0',
        totalCostPrice: '0', marginPercent: '', stockQuantity: '', imageUrl: '', isActive: true, gstRate: '0'
    });

    useEffect(() => {
        apiClient.get('/categories').then(r => setCategories(r.data)).catch(() => { });
        if (isEdit) {
            setLoading(true);
            apiClient.get(`/products/${id}`).then(r => {
                const p = r.data;
                const cost = p.costPrice || 0;
                const gst = p.gstRate || 0;
                const totalCost = cost + (cost * gst / 100);

                setForm({
                    name: p.name,
                    description: p.description || '',
                    categoryId: p.categoryId || '',
                    price: String(p.price),
                    costPrice: String(cost),
                    totalCostPrice: String(totalCost),
                    marginPercent: p.marginPercent != null ? String(p.marginPercent) : '',
                    stockQuantity: String(p.stockQuantity),
                    imageUrl: p.imageUrl || '',
                    isActive: p.isActive,
                    gstRate: String(gst)
                });
            }).catch(() => { toast.error('Product not found'); navigate('/admin'); })
                .finally(() => setLoading(false));
        }
    }, [id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = {
                name: form.name,
                description: form.description,
                categoryId: form.categoryId || undefined,
                price: parseFloat(form.price),
                costPrice: parseFloat(form.costPrice) || 0,
                gstRate: parseFloat(form.gstRate) || 0,
                marginPercent: form.marginPercent !== '' ? parseFloat(form.marginPercent) : null,
                stockQuantity: parseInt(form.stockQuantity),
                imageUrl: form.imageUrl || undefined,
                isActive: form.isActive,
            };
            if (isEdit) {
                await apiClient.put(`/products/${id}`, payload);
                toast.success('Product updated');
            } else {
                await apiClient.post('/products', payload);
                toast.success('Product created');
            }
            navigate('/admin');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to save');
        } finally { setSubmitting(false); }
    };

    const inputCls = "w-full mt-1 px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500";

    if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent"></div></div>;

    return (
        <div>
            <button onClick={() => navigate('/admin')} className="text-gray-400 hover:text-white flex items-center gap-1 mb-4"><ArrowLeft className="h-4 w-4" /> Back</button>
            <h2 className="text-2xl font-bold text-white mb-6">{isEdit ? 'Edit Product' : 'Add New Product'}</h2>

            <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-2xl p-6 max-w-2xl space-y-4">
                <div>
                    <label className="text-gray-400 text-sm">Product Name *</label>
                    <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className={inputCls} placeholder="Product name" />
                </div>

                <div>
                    <label className="text-gray-400 text-sm">Description</label>
                    <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className={inputCls} rows={3} placeholder="Description" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-gray-400 text-sm">Category</label>
                        <select value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })} className={inputCls}>
                            <option value="">Select category</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-gray-400 text-sm">Image URL</label>
                        <input value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} className={inputCls} placeholder="https://..." />
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 bg-black/20 p-4 rounded-xl border border-white/5">
                    <div>
                        <label className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-1 block">Base Cost (₹)</label>
                        <input type="number" min="0" step="0.01" value={form.costPrice}
                            onChange={e => {
                                const newCost = e.target.value;
                                setForm(prev => {
                                    const costNum = parseFloat(newCost) || 0;
                                    const gstNum = parseFloat(prev.gstRate) || 0;
                                    const marginNum = parseFloat(prev.marginPercent) || 0;
                                    const totalCost = costNum + (costNum * gstNum / 100);
                                    let newPrice = prev.price;
                                    if (prev.marginPercent !== '') {
                                        newPrice = String(Math.round((totalCost + (totalCost * marginNum / 100)) * 100) / 100);
                                    }
                                    return { ...prev, costPrice: newCost, totalCostPrice: String(totalCost), price: newPrice };
                                });
                            }}
                            className={inputCls} placeholder="0" />
                    </div>
                    <div>
                        <label className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-1 block">GST Rate (%)</label>
                        <input type="number" min="0" max="100" step="0.01" value={form.gstRate}
                            onChange={e => {
                                const newGst = e.target.value;
                                setForm(prev => {
                                    const costNum = parseFloat(prev.costPrice) || 0;
                                    const gstNum = parseFloat(newGst) || 0;
                                    const marginNum = parseFloat(prev.marginPercent) || 0;
                                    const totalCost = costNum + (costNum * gstNum / 100);
                                    let newPrice = prev.price;
                                    if (prev.marginPercent !== '') {
                                        newPrice = String(Math.round((totalCost + (totalCost * marginNum / 100)) * 100) / 100);
                                    }
                                    return { ...prev, gstRate: newGst, totalCostPrice: String(totalCost), price: newPrice };
                                });
                            }} className={inputCls} placeholder="0" />
                    </div>
                    <div>
                        <label className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-1 block">Total Cost (₹)</label>
                        <input type="number" min="0" step="0.01" value={form.totalCostPrice}
                            onChange={e => {
                                const newTotal = e.target.value;
                                setForm(prev => {
                                    const totalNum = parseFloat(newTotal) || 0;
                                    const gstNum = parseFloat(prev.gstRate) || 0;
                                    const marginNum = parseFloat(prev.marginPercent) || 0;
                                    const baseCost = gstNum > 0 ? (totalNum / (1 + gstNum / 100)) : totalNum;
                                    let newPrice = prev.price;
                                    if (prev.marginPercent !== '') {
                                        newPrice = String(Math.round((totalNum + (totalNum * marginNum / 100)) * 100) / 100);
                                    }
                                    return { ...prev, totalCostPrice: newTotal, costPrice: String(Math.round(baseCost * 100) / 100), price: newPrice };
                                });
                            }} className={inputCls} title="Cost Price including GST" placeholder="0" />
                    </div>
                    <div>
                        <label className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-1 block">Margin (%)</label>
                        <input type="number" min="0" step="0.01" value={form.marginPercent}
                            onChange={e => {
                                const newMargin = e.target.value;
                                setForm(prev => {
                                    const totalNum = parseFloat(prev.totalCostPrice) || 0;
                                    const marginNum = parseFloat(newMargin) || 0;
                                    const newPrice = newMargin !== '' ? String(Math.round((totalNum + (totalNum * marginNum / 100)) * 100) / 100) : prev.price;
                                    return { ...prev, marginPercent: newMargin, price: newPrice };
                                });
                            }} className={inputCls} placeholder="Optional" />
                    </div>
                    <div>
                        <label className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-1 block">Base Sale (₹)</label>
                        <input type="number" min="0" step="0.01"
                            value={String(Math.round(((parseFloat(form.price) || 0) / (1 + (parseFloat(form.gstRate) || 0) / 100)) * 100) / 100)}
                            onChange={e => {
                                const baseSale = parseFloat(e.target.value) || 0;
                                const gstNum = parseFloat(form.gstRate) || 0;
                                const newMRP = baseSale + (baseSale * gstNum / 100);
                                setForm({ ...form, price: String(Math.round(newMRP * 100) / 100), marginPercent: '' });
                            }}
                            className={inputCls} placeholder="0" />
                    </div>
                    <div>
                        <label className="text-indigo-400 text-xs uppercase tracking-wider font-bold mb-1 block">MRP (₹) *</label>
                        <input type="number" min="0" step="0.01" required value={form.price}
                            onChange={e => setForm({ ...form, price: e.target.value, marginPercent: '' })}
                            className={`${inputCls} border-indigo-500/30 bg-indigo-500/5`} title="Selling Price including GST" placeholder="0" />
                    </div>
                </div>

                <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm">Gross Margin (incl. GST)</span>
                        <span className="text-white font-medium">
                            ₹{Math.max(0, (parseFloat(form.price) || 0) - (parseFloat(form.totalCostPrice) || 0)).toFixed(2)}
                        </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-white/5">
                        <span className="text-gray-400 text-sm">Estimated Net Profit (ex-tax)</span>
                        <span className="text-emerald-400 font-bold">
                            ₹{(Math.max(0, (parseFloat(form.price) || 0) - (parseFloat(form.totalCostPrice) || 0)) / (1 + (parseFloat(form.gstRate) || 0) / 100)).toFixed(2)}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-gray-400 text-sm">Stock Quantity *</label>
                        <input type="number" min="0" required value={form.stockQuantity} onChange={e => setForm({ ...form, stockQuantity: e.target.value })} className={inputCls} placeholder="0" />
                    </div>
                    <div className="flex items-end pb-2">
                        <div className="flex items-center gap-2">
                            <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="accent-indigo-500 w-4 h-4 rounded" />
                            <span className="text-gray-400 text-sm">Active (visible to customers)</span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 pt-2">
                    <button type="submit" disabled={submitting} className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2.5 rounded-xl hover:from-indigo-500 hover:to-purple-500 transition-all disabled:opacity-50">
                        {submitting ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
                    </button>
                    <button type="button" onClick={() => navigate('/admin')} className="text-gray-400 hover:text-white px-4 py-2.5">Cancel</button>
                </div>
            </form>
        </div>
    );
}
