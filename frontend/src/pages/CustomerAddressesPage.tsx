import { useState, useEffect } from 'react';
import { MapPin, Plus, Trash2, Edit2, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../lib/api';

interface Address {
    id: string;
    label: string;
    name: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    isDefault: boolean;
}

export function CustomerAddressesPage() {
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [form, setForm] = useState({
        label: 'HOME',
        name: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        isDefault: false,
    });

    useEffect(() => {
        fetchAddresses();
    }, []);

    const fetchAddresses = async () => {
        try {
            const res = await apiClient.get('/user/addresses');
            setAddresses(res.data.data || []);
        } catch (err) {
            toast.error('Failed to load addresses');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenForm = (addr?: Address) => {
        if (addr) {
            setForm({ ...addr });
            setEditingId(addr.id);
        } else {
            setForm({
                label: 'HOME', name: '', phone: '', address: '',
                city: '', state: '', pincode: '', isDefault: false
            });
            setEditingId(null);
        }
        setIsFormOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                await apiClient.put(`/user/addresses/${editingId}`, form);
                toast.success('Address updated');
            } else {
                await apiClient.post('/user/addresses', form);
                toast.success('Address added');
            }
            setIsFormOpen(false);
            fetchAddresses();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Failed to save address');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this address?')) return;
        try {
            await apiClient.delete(`/user/addresses/${id}`);
            toast.success('Address deleted');
            fetchAddresses();
        } catch (err) {
            toast.error('Failed to delete address');
        }
    };

    const setAsDefault = async (id: string) => {
        try {
            await apiClient.put(`/user/addresses/${id}`, { isDefault: true });
            toast.success('Default address updated');
            fetchAddresses();
        } catch (err) {
            toast.error('Failed to set default address');
        }
    };

    if (loading) {
        return <div className="text-gray-400">Loading addresses...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Saved Addresses</h2>
                {!isFormOpen && (
                    <button
                        onClick={() => handleOpenForm()}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2"
                    >
                        <Plus className="h-4 w-4" /> Add New
                    </button>
                )}
            </div>

            {isFormOpen ? (
                <div className="bg-slate-900 border border-white/10 p-6 rounded-2xl">
                    <h3 className="text-lg font-semibold text-white mb-4">
                        {editingId ? 'Edit Address' : 'Add New Address'}
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Label</label>
                                <select
                                    value={form.label}
                                    onChange={e => setForm({ ...form, label: e.target.value })}
                                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white"
                                >
                                    <option value="HOME">Home</option>
                                    <option value="WORK">Work</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Full Name</label>
                                <input
                                    required type="text" value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Phone Number</label>
                                <input
                                    required type="text" value={form.phone}
                                    onChange={e => setForm({ ...form, phone: e.target.value })}
                                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Pincode</label>
                                <input
                                    required type="text" value={form.pincode}
                                    onChange={e => setForm({ ...form, pincode: e.target.value })}
                                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Full Address</label>
                            <textarea
                                required value={form.address}
                                onChange={e => setForm({ ...form, address: e.target.value })}
                                rows={2}
                                className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">City</label>
                                <input
                                    required type="text" value={form.city}
                                    onChange={e => setForm({ ...form, city: e.target.value })}
                                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">State</label>
                                <input
                                    required type="text" value={form.state}
                                    onChange={e => setForm({ ...form, state: e.target.value })}
                                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white"
                                />
                            </div>
                        </div>

                        <label className="flex items-center gap-2 mt-4 cursor-pointer text-sm text-gray-300">
                            <input
                                type="checkbox"
                                checked={form.isDefault}
                                onChange={e => setForm({ ...form, isDefault: e.target.checked })}
                                className="rounded bg-slate-900 border-white/20 text-indigo-500 focus:ring-indigo-500"
                            />
                            Set as default address
                        </label>

                        <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                            <button
                                type="submit"
                                className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-medium text-sm"
                            >
                                Save Address
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsFormOpen(false)}
                                className="px-5 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 font-medium text-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.length === 0 ? (
                        <div className="col-span-full text-center py-12 text-gray-500">
                            <MapPin className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p>No saved addresses yet.</p>
                        </div>
                    ) : (
                        addresses.map(addr => (
                            <div key={addr.id} className={`p-5 rounded-2xl border ${addr.isDefault ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-slate-900 border-white/10'}`}>
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                       <span className="bg-white/10 text-xs font-semibold px-2 py-1 rounded-md text-gray-300 uppercase tracking-wider">
                                           {addr.label}
                                       </span>
                                       {addr.isDefault && (
                                           <span className="text-indigo-400 flex items-center gap-1 text-xs font-medium">
                                               <CheckCircle2 className="h-3.5 w-3.5" /> Default
                                           </span>
                                       )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => handleOpenForm(addr)} className="p-1.5 text-gray-400 hover:text-indigo-400 transition-colors">
                                            <Edit2 className="h-4 w-4" />
                                        </button>
                                        <button onClick={() => handleDelete(addr.id)} className="p-1.5 text-gray-400 hover:text-red-400 transition-colors">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                                <p className="font-semibold text-white">{addr.name}</p>
                                <p className="text-gray-400 text-sm mt-1">{addr.address}</p>
                                <p className="text-gray-400 text-sm">{addr.city}, {addr.state} {addr.pincode}</p>
                                <p className="text-gray-400 text-sm mt-1">Ph: {addr.phone}</p>

                                {!addr.isDefault && (
                                    <button
                                        onClick={() => setAsDefault(addr.id)}
                                        className="mt-4 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                                    >
                                        Set as Default
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
