import { useState, useEffect } from 'react';
import { CreditCard, Plus, Trash2, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../lib/api';

interface PaymentMethod {
    id: string;
    type: string;
    provider: string;
    identifier: string;
    isDefault: boolean;
}

export function CustomerPaymentsPage() {
    const [methods, setMethods] = useState<PaymentMethod[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    
    const [form, setForm] = useState({
        type: 'UPI',
        provider: '',
        identifier: '',
        isDefault: false,
    });

    useEffect(() => {
        fetchMethods();
    }, []);

    const fetchMethods = async () => {
        try {
            const res = await apiClient.get('/user/payment-methods');
            setMethods(res.data.data || []);
        } catch (err) {
            toast.error('Failed to load payment methods');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await apiClient.post('/user/payment-methods', form);
            toast.success('Payment method added');
            setIsFormOpen(false);
            fetchMethods();
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Failed to add payment method');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this payment method?')) return;
        try {
            await apiClient.delete(`/user/payment-methods/${id}`);
            toast.success('Deleted payment method');
            fetchMethods();
        } catch (err) {
            toast.error('Failed to delete payment method');
        }
    };

    if (loading) {
        return <div className="text-gray-400">Loading methods...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Payment Methods</h2>
                {!isFormOpen && (
                    <button
                        onClick={() => setIsFormOpen(true)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2"
                    >
                        <Plus className="h-4 w-4" /> Add Method
                    </button>
                )}
            </div>

            {isFormOpen ? (
                <div className="bg-slate-900 border border-white/10 p-6 rounded-2xl max-w-xl">
                    <h3 className="text-lg font-semibold text-white mb-4">Add Payment Method</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Type</label>
                            <select
                                value={form.type}
                                onChange={e => setForm({ ...form, type: e.target.value })}
                                className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white"
                            >
                                <option value="UPI">UPI Setup</option>
                                <option value="CARD">Debit / Credit Card</option>
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Provider (Optional)</label>
                            <input
                                type="text" 
                                placeholder={form.type === 'UPI' ? 'Google Pay, PhonePe...' : 'Visa, Mastercard...'}
                                value={form.provider}
                                onChange={e => setForm({ ...form, provider: e.target.value })}
                                className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white"
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-1">
                                {form.type === 'UPI' ? 'UPI ID' : 'Card ending with (Last 4 digits)'}
                            </label>
                            <input
                                required type="text"
                                placeholder={form.type === 'UPI' ? 'username@upi' : '1234'}
                                value={form.identifier}
                                onChange={e => setForm({ ...form, identifier: e.target.value })}
                                className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-white"
                            />
                        </div>

                        <label className="flex items-center gap-2 mt-4 cursor-pointer text-sm text-gray-300">
                            <input
                                type="checkbox"
                                checked={form.isDefault}
                                onChange={e => setForm({ ...form, isDefault: e.target.checked })}
                                className="rounded bg-slate-900 border-white/20 text-indigo-500 focus:ring-indigo-500"
                            />
                            Set as default method
                        </label>

                        <div className="flex items-center gap-3 pt-4">
                            <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium">Save</button>
                            <button type="button" onClick={() => setIsFormOpen(false)} className="px-5 py-2.5 rounded-xl text-gray-400 hover:text-white text-sm">Cancel</button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {methods.length === 0 ? (
                        <div className="col-span-full text-center py-12 text-gray-500">
                            <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p>No saved payment methods setup yet.</p>
                        </div>
                    ) : (
                        methods.map(method => (
                            <div key={method.id} className="p-5 bg-slate-900 border border-white/10 rounded-2xl flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-xl ${method.type === 'UPI' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                        {method.type === 'UPI' ? <Smartphone className="h-6 w-6" /> : <CreditCard className="h-6 w-6" />}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-white flex items-center gap-2">
                                            {method.provider || method.type}
                                            {method.isDefault && <span className="bg-indigo-500/20 text-indigo-400 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">Default</span>}
                                        </p>
                                        <p className="text-sm text-gray-400">{method.type === 'CARD' ? '**** **** **** ' : ''}{method.identifier}</p>
                                    </div>
                                </div>
                                <button onClick={() => handleDelete(method.id)} className="p-2 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
