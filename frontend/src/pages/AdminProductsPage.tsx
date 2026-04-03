import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Search, Store } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../lib/api';
import { Product, Category } from '../types';

export default function AdminProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [catFilter, setCatFilter] = useState('');

    useEffect(() => {
        Promise.all([
            apiClient.get('/products'),
            apiClient.get('/categories'),
        ]).then(([pRes, cRes]) => {
            setProducts(pRes.data);
            setCategories(cRes.data);
        }).catch(() => toast.error('Failed to load'))
            .finally(() => setLoading(false));
    }, []);

    const toggleActive = async (id: string, isActive: boolean) => {
        try {
            if (!isActive) {
                await apiClient.delete(`/products/${id}`);
            } else {
                await apiClient.put(`/products/${id}`, { isActive: true });
            }
            setProducts(prev => prev.map(p => p.id === id ? { ...p, isActive: !p.isActive } : p));
            toast.success('Product updated');
        } catch { toast.error('Failed to update'); }
    };

    const filtered = products.filter(p => {
        const matchesCat = !catFilter || p.categoryId === catFilter;
        const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
        return matchesCat && matchesSearch;
    });

    if (loading) {
        return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent"></div></div>;
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Products</h2>
                <Link to="/admin/products/new" className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:from-indigo-500 hover:to-purple-500 transition-all text-sm">
                    <Plus className="h-4 w-4" /> Add Product
                </Link>
            </div>

            <div className="flex gap-3 mb-6">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-xl text-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">All Categories</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <table className="w-full">
                    <thead className="bg-white/5">
                        <tr className="text-gray-400 text-xs uppercase">
                            <th className="text-left px-4 py-3">Product</th>
                            <th className="text-left px-4 py-3">Category</th>
                            <th className="text-right px-4 py-3">Price</th>
                            <th className="text-right px-4 py-3">Stock</th>
                            <th className="text-center px-4 py-3">Status</th>
                            <th className="text-right px-4 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filtered.map(product => (
                            <tr key={product.id} className="hover:bg-white/5 transition-colors">
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center flex-shrink-0">
                                            {product.imageUrl ? <img src={product.imageUrl} alt="" className="w-full h-full object-cover rounded-lg" /> : <Store className="h-5 w-5 text-gray-600" />}
                                        </div>
                                        <span className="text-white text-sm font-medium">{product.name}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-gray-400 text-sm">{product.category?.name || '-'}</td>
                                <td className="px-4 py-3 text-right text-indigo-400 font-medium">₹{product.price}</td>
                                <td className="px-4 py-3 text-right">
                                    <span className={`${product.stockQuantity > 10 ? 'text-emerald-400' : product.stockQuantity > 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                                        {product.stockQuantity}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <span className={`text-xs px-2 py-1 rounded-full ${product.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                        {product.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <Link to={`/admin/products/${product.id}/edit`} className="text-gray-400 hover:text-indigo-400"><Edit className="h-4 w-4" /></Link>
                                        <button onClick={() => toggleActive(product.id, !product.isActive)} className="text-gray-400 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filtered.length === 0 && <p className="text-center text-gray-500 py-8">No products found</p>}
            </div>
        </div>
    );
}
