import { useState, useEffect } from 'react';
import { Save, Search, RefreshCw, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../lib/api';
import { Product } from '../types';

interface EditableProduct extends Product {
    newPrice?: number;
    newCostPrice?: number;
    newGstRate?: number;
    changed?: boolean;
}

export function AdminBulkRateUpdatePage() {
    const [products, setProducts] = useState<EditableProduct[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get('/products');
            setProducts(res.data.map((p: any) => ({
                ...p,
                newPrice: p.price,
                newCostPrice: p.costPrice || 0,
                newGstRate: p.gstRate || 0,
                changed: false,
            })));
        } catch { toast.error('Failed to load products'); }
        finally { setLoading(false); }
    };

    const fetchCategories = async () => {
        try {
            const res = await apiClient.get('/categories');
            setCategories(res.data);
        } catch { /* silently fail */ }
    };

    const handlePriceChange = (id: string, value: number) => {
        setProducts(prev => prev.map(p =>
            p.id === id ? { ...p, newPrice: value, changed: value !== p.price || (p.newCostPrice || 0) !== (p.costPrice || 0) || (p.newGstRate || 0) !== (p.gstRate || 0) } : p
        ));
    };

    const handleCostChange = (id: string, value: number) => {
        setProducts(prev => prev.map(p =>
            p.id === id ? { ...p, newCostPrice: value, changed: (p.newPrice || p.price) !== p.price || value !== (p.costPrice || 0) || (p.newGstRate || 0) !== (p.gstRate || 0) } : p
        ));
    };

    const handleGstChange = (id: string, value: number) => {
        setProducts(prev => prev.map(p =>
            p.id === id ? { ...p, newGstRate: value, changed: (p.newPrice || p.price) !== p.price || (p.newCostPrice || p.costPrice) !== (p.costPrice || 0) || value !== (p.gstRate || 0) } : p
        ));
    };

    const changedProducts = products.filter(p => p.changed);

    const handleSave = async () => {
        if (changedProducts.length === 0) {
            toast.error('No changes to save');
            return;
        }
        setSaving(true);
        try {
            const updates = changedProducts.map(p => ({
                productId: p.id,
                price: p.newPrice,
                costPrice: p.newCostPrice,
                gstRate: p.newGstRate,
            }));
            await apiClient.put('/products/bulk-update', { updates });
            toast.success(`${updates.length} product(s) updated!`);
            fetchProducts();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update');
        } finally {
            setSaving(false);
        }
    };

    const filtered = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.category?.name?.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = !selectedCategory || p.categoryId === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent"></div></div>;

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Bulk Rate Update & Profit Analysis</h2>
                <div className="flex gap-2">
                    <button onClick={fetchProducts} className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm border border-white/10">
                        <RefreshCw className="h-4 w-4" /> Reset
                    </button>
                    <button onClick={handleSave} disabled={changedProducts.length === 0 || saving}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:from-indigo-500 hover:to-purple-500 transition-all text-sm disabled:opacity-50">
                        <Save className="h-4 w-4" /> Save Changes ({changedProducts.length})
                    </button>
                </div>
            </div>

            {/* Search + Category Filter */}
            <div className="flex gap-3 mb-6">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}
                        className="pl-10 pr-8 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm min-w-[180px]">
                        <option value="">All Categories</option>
                        {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <table className="w-full">
                    <thead className="bg-white/5">
                        <tr className="text-gray-400 text-xs uppercase text-center">
                            <th className="text-left px-4 py-3">Product</th>
                            <th className="px-4 py-3">Cost Price (₹)</th>
                            <th className="px-4 py-3">Selling Price / MRP (₹)</th>
                            <th className="px-4 py-3">Profit / Margin</th>
                            <th className="px-4 py-3">GST %</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filtered.map(product => {
                            const currentCost = product.newCostPrice ?? product.costPrice ?? 0;
                            const currentSelling = product.newPrice ?? product.price ?? 0;
                            const currentGstRate = product.newGstRate ?? product.gstRate ?? 0;

                            // True Profit: Base Selling Price (without GST) minus Cost Price
                            const baseSellingPrice = currentGstRate > 0 ? currentSelling / (1 + currentGstRate / 100) : currentSelling;
                            const profit = baseSellingPrice - currentCost;
                            const margin = baseSellingPrice > 0 ? (profit / baseSellingPrice) * 100 : 0;

                            return (
                                <tr key={product.id} className={`transition-colors text-center ${product.changed ? 'bg-indigo-500/10 border-l-2 border-indigo-500' : 'hover:bg-white/5'}`}>
                                    <td className="px-4 py-3 text-left">
                                        <p className="text-white font-medium text-sm">{product.name}</p>
                                        <p className="text-gray-500 text-[10px]">{product.category?.name || '—'}</p>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-col items-center">
                                            <span className="text-[10px] text-gray-500 mb-1">Was: ₹{product.costPrice?.toFixed(1) || 0}</span>
                                            <input type="number" min="0" step="0.01" value={product.newCostPrice}
                                                onChange={e => handleCostChange(product.id, Number(e.target.value))}
                                                className={`w-20 text-center bg-white/10 border rounded-lg px-2 py-1 text-sm ${product.changed ? 'border-orange-500 text-orange-300' : 'border-white/10 text-white'}`} />
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-col items-center">
                                            <span className="text-[10px] text-gray-500 mb-1">Was: ₹{product.price.toFixed(1)}</span>
                                            <input type="number" min="0" step="0.01" value={product.newPrice}
                                                onChange={e => handlePriceChange(product.id, Number(e.target.value))}
                                                className={`w-24 text-center bg-white/10 border rounded-lg px-2 py-1 text-sm ${product.changed ? 'border-indigo-500 text-indigo-300' : 'border-white/10 text-white'}`} />
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <p className={`text-sm font-bold ${profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>₹{profit.toFixed(1)}</p>
                                        <p className="text-[10px] text-gray-500">{margin.toFixed(1)}% margin</p>
                                    </td>
                                    <td className="px-4 py-3">
                                        <input type="number" min="0" max="100" step="0.5" value={product.newGstRate}
                                            onChange={e => handleGstChange(product.id, Number(e.target.value))}
                                            className={`w-16 text-center bg-white/10 border rounded-lg px-2 py-1 text-sm ${product.changed ? 'border-indigo-500 text-indigo-300' : 'border-white/10 text-white'}`} />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {filtered.length === 0 && <p className="text-center text-gray-500 py-8">No products found</p>}
            </div>
        </div>
    );
}
