import { useState, useEffect } from 'react';
import { Store, Plus, ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../lib/api';
import { Shop } from '../types';

export default function HoodalAdminPage() {
    const [shops, setShops] = useState<Shop[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        name: '', description: '', address: '', phone: '',
        adminEmail: '', adminPassword: '', adminFirstName: '', adminLastName: '',
    });
    const [createdCreds, setCreatedCreds] = useState<{ email: string; password: string; shopName: string } | null>(null);

    useEffect(() => { fetchShops(); }, []);

    const fetchShops = async () => {
        try {
            const res = await apiClient.get('/shops');
            setShops(res.data.data || []);
        } catch { toast.error('Failed to load shops'); }
        finally { setLoading(false); }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await apiClient.post('/shops', form);
            setCreatedCreds({ email: form.adminEmail, password: form.adminPassword, shopName: form.name });
            setForm({ name: '', description: '', address: '', phone: '', adminEmail: '', adminPassword: '', adminFirstName: '', adminLastName: '' });
            setShowForm(false);
            fetchShops();
            toast.success('Shop onboarded successfully!');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to onboard shop');
        } finally { setSubmitting(false); }
    };

    const toggleShop = async (id: string) => {
        try {
            await apiClient.patch(`/shops/${id}/toggle`);
            fetchShops();
            toast.success('Shop status updated');
        } catch { toast.error('Failed to toggle shop'); }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white">HOODAL Admin</h1>
                        <p className="text-gray-400 mt-1">Manage shops on the marketplace</p>
                    </div>
                    <button
                        onClick={() => { setShowForm(!showForm); setCreatedCreds(null); }}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg shadow-indigo-500/25"
                    >
                        <Plus className="h-5 w-5" /> Onboard Shop
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                        <div className="flex items-center gap-3">
                            <div className="bg-indigo-500/20 p-2.5 rounded-lg"><Store className="h-5 w-5 text-indigo-400" /></div>
                            <div>
                                <p className="text-2xl font-bold text-white">{shops.length}</p>
                                <p className="text-gray-400 text-sm">Total Shops</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                        <div className="flex items-center gap-3">
                            <div className="bg-emerald-500/20 p-2.5 rounded-lg"><Store className="h-5 w-5 text-emerald-400" /></div>
                            <div>
                                <p className="text-2xl font-bold text-white">{shops.filter(s => s.isActive).length}</p>
                                <p className="text-gray-400 text-sm">Active Shops</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                        <div className="flex items-center gap-3">
                            <div className="bg-orange-500/20 p-2.5 rounded-lg"><Store className="h-5 w-5 text-orange-400" /></div>
                            <div>
                                <p className="text-2xl font-bold text-white">{shops.filter(s => !s.isActive).length}</p>
                                <p className="text-gray-400 text-sm">Inactive Shops</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Created Credentials Alert */}
                {createdCreds && (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-5 mb-6">
                        <h3 className="text-emerald-400 font-semibold mb-2">✅ Shop "{createdCreds.shopName}" Created!</h3>
                        <p className="text-gray-300 text-sm mb-1">Share these credentials with the shop owner:</p>
                        <div className="bg-black/30 rounded-lg p-3 font-mono text-sm">
                            <p className="text-gray-300">Email: <span className="text-white">{createdCreds.email}</span></p>
                            <p className="text-gray-300">Password: <span className="text-white">{createdCreds.password}</span></p>
                        </div>
                    </div>
                )}

                {/* Onboard Form */}
                {showForm && (
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
                        <h2 className="text-xl font-bold text-white mb-4">Onboard New Shop</h2>
                        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2"><h3 className="text-indigo-400 font-medium text-sm">Shop Details</h3></div>
                            {['name', 'phone', 'address', 'description'].map(f => (
                                <div key={f} className={f === 'description' || f === 'address' ? 'md:col-span-2' : ''}>
                                    <label className="text-gray-400 text-sm capitalize">{f === 'name' ? 'Shop Name' : f}</label>
                                    <input
                                        value={(form as any)[f]}
                                        onChange={e => setForm({ ...form, [f]: e.target.value })}
                                        required={f === 'name'}
                                        className="w-full mt-1 px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder={`Enter ${f}`}
                                    />
                                </div>
                            ))}

                            <div className="md:col-span-2 mt-2"><h3 className="text-indigo-400 font-medium text-sm">Shop Admin Credentials</h3></div>
                            {[
                                { key: 'adminFirstName', label: 'First Name' },
                                { key: 'adminLastName', label: 'Last Name' },
                                { key: 'adminEmail', label: 'Email' },
                                { key: 'adminPassword', label: 'Password' },
                            ].map(f => (
                                <div key={f.key}>
                                    <label className="text-gray-400 text-sm">{f.label}</label>
                                    <input
                                        type={f.key === 'adminPassword' ? 'password' : f.key === 'adminEmail' ? 'email' : 'text'}
                                        value={(form as any)[f.key]}
                                        onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                                        required
                                        className="w-full mt-1 px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder={f.label}
                                    />
                                </div>
                            ))}

                            <div className="md:col-span-2 flex gap-3 mt-2">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2.5 rounded-xl hover:from-indigo-500 hover:to-purple-500 transition-all disabled:opacity-50"
                                >
                                    {submitting ? 'Creating...' : 'Create Shop'}
                                </button>
                                <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white px-4 py-2.5">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Shop List */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent"></div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {shops.map(shop => (
                            <div key={shop.id} className="bg-white/5 border border-white/10 rounded-xl p-5 flex items-center justify-between hover:border-indigo-500/30 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="bg-indigo-500/20 p-3 rounded-xl">
                                        <Store className="h-6 w-6 text-indigo-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-semibold">{shop.name}</h3>
                                        <p className="text-gray-500 text-sm">{shop.address || 'No address'}</p>
                                        <p className="text-gray-600 text-xs mt-0.5">Owner: {shop.owner?.email || 'N/A'}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <span className={`text-xs px-2.5 py-1 rounded-full ${shop.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                        {shop.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                    <button
                                        onClick={() => toggleShop(shop.id)}
                                        className="text-gray-400 hover:text-indigo-400 transition-colors"
                                        title={shop.isActive ? 'Deactivate' : 'Activate'}
                                    >
                                        {shop.isActive ? <ToggleRight className="h-6 w-6 text-emerald-400" /> : <ToggleLeft className="h-6 w-6" />}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
