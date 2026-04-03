import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Eye, IndianRupee, History, Receipt, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../lib/api';
import { format } from 'date-fns';

export function AdminSuppliersPage() {
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
    const [formData, setFormData] = useState({ id: '', name: '', contact: '', email: '', address: '', gst: '' });
    const [paymentData, setPaymentData] = useState({ amount: '', paymentMode: 'CASH', referenceNo: '', date: format(new Date(), 'yyyy-MM-dd'), purchaseId: '' });
    const [isSavingPayment, setIsSavingPayment] = useState(false);

    const fetchSuppliers = () => {
        setLoading(true);
        apiClient.get('/suppliers')
            .then(res => setSuppliers(res.data))
            .catch(() => toast.error('Failed to load suppliers'))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (formData.id) {
                await apiClient.put(`/suppliers/${formData.id}`, formData);
                toast.success('Supplier updated');
            } else {
                await apiClient.post('/suppliers', formData);
                toast.success('Supplier added');
            }
            setShowModal(false);
            fetchSuppliers();
        } catch {
            toast.error('Failed to save supplier');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this supplier?')) return;
        try {
            await apiClient.delete(`/suppliers/${id}`);
            toast.success('Supplier deleted');
            fetchSuppliers();
        } catch {
            toast.error('Failed to delete supplier');
        }
    };

    const fetchSupplierDetails = async (id: string) => {
        try {
            const res = await apiClient.get(`/suppliers/${id}`);
            setSelectedSupplier(res.data);
            setShowDetailModal(true);
        } catch {
            toast.error('Failed to load supplier details');
        }
    };

    const handleAddPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSupplier) return;
        setIsSavingPayment(true);
        try {
            await apiClient.post(`/suppliers/${selectedSupplier.id}/payments`, paymentData);
            toast.success('Payment added');
            setPaymentData({ amount: '', paymentMode: 'CASH', referenceNo: '', date: format(new Date(), 'yyyy-MM-dd'), purchaseId: '' });
            // Refresh detailed data
            const res = await apiClient.get(`/suppliers/${selectedSupplier.id}`);
            setSelectedSupplier(res.data);
            fetchSuppliers(); // Refresh list as well for balance update
        } catch (error: any) {
            const message = error.response?.data?.details || error.response?.data?.error || 'Failed to add payment';
            toast.error(message);
        } finally {
            setIsSavingPayment(false);
        }
    };

    const filtered = suppliers.filter(s =>
        !search || s.name.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent"></div></div>;

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Suppliers</h2>
                <button onClick={() => { setFormData({ id: '', name: '', contact: '', email: '', address: '', gst: '' }); setShowModal(true); }} className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:from-indigo-500 hover:to-purple-500 transition-all text-sm">
                    <Plus className="h-4 w-4" /> Add Supplier
                </button>
            </div>

            <div className="flex gap-3 mb-6">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search suppliers..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <table className="w-full">
                    <thead className="bg-white/5">
                        <tr className="text-gray-400 text-xs uppercase">
                            <th className="text-left px-4 py-3">Name</th>
                            <th className="text-left px-4 py-3">Contact</th>
                            <th className="text-left px-4 py-3">GST</th>
                            <th className="text-right px-4 py-3">Products</th>
                            <th className="text-right px-4 py-3">Balance</th>
                            <th className="text-right px-4 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filtered.map(supplier => (
                            <tr key={supplier.id} className="hover:bg-white/5 transition-colors">
                                <td className="px-4 py-3 text-white font-medium">{supplier.name}</td>
                                <td className="px-4 py-3 text-gray-400 text-sm">{supplier.contact || '-'}</td>
                                <td className="px-4 py-3 text-gray-400 text-sm">{supplier.gst || '-'}</td>
                                <td className="px-4 py-3 text-right text-gray-400 text-sm">{supplier._count?.products || 0}</td>
                                <td className="px-4 py-3 text-right">
                                    <span className={`font-bold ${supplier.balance > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                        ₹{supplier.balance?.toLocaleString() || 0}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button onClick={() => fetchSupplierDetails(supplier.id)} className="text-gray-400 hover:text-indigo-400" title="View History"><Eye className="h-4 w-4" /></button>
                                        <button onClick={() => { setFormData(supplier); setShowModal(true); }} className="text-gray-400 hover:text-indigo-400" title="Edit"><Edit className="h-4 w-4" /></button>
                                        <button onClick={() => handleDelete(supplier.id)} className="text-gray-400 hover:text-red-400" title="Delete"><Trash2 className="h-4 w-4" /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filtered.length === 0 && <p className="text-center text-gray-500 py-8">No suppliers found</p>}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-800 rounded-2xl w-full max-w-md border border-white/10 p-6">
                        <h3 className="text-xl font-bold text-white mb-4">{formData.id ? 'Edit Supplier' : 'Add Supplier'}</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                                <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Contact</label>
                                <input value={formData.contact} onChange={e => setFormData({ ...formData, contact: e.target.value })} className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                                <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Address</label>
                                <input value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">GST/Tax ID</label>
                                <input value={formData.gst} onChange={e => setFormData({ ...formData, gst: e.target.value })} className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-white" />
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl transition-colors">Cancel</button>
                                <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl transition-colors">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showDetailModal && selectedSupplier && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-white/10 flex flex-col">
                        <div className="p-6 border-b border-white/10 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-white">{selectedSupplier.name}</h3>
                                <p className="text-sm text-gray-400">{selectedSupplier.contact} | {selectedSupplier.gst || 'No GST'}</p>
                            </div>
                            <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-white">✕</button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-8">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                                    <p className="text-gray-400 text-xs uppercase mb-1">Total Purchases</p>
                                    <p className="text-2xl font-bold text-white">₹{selectedSupplier.purchases?.reduce((acc: any, p: any) => acc + p.totalAmount, 0).toLocaleString()}</p>
                                </div>
                                <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                                    <p className="text-gray-400 text-xs uppercase mb-1">Total Paid</p>
                                    <p className="text-2xl font-bold text-green-400">₹{selectedSupplier.supplierPayments?.reduce((acc: any, p: any) => acc + p.amount, 0).toLocaleString()}</p>
                                </div>
                                <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                                    <p className="text-gray-400 text-xs uppercase mb-1">Pending Balance</p>
                                    <p className={`text-2xl font-bold ${selectedSupplier.balance > 0 ? 'text-red-400' : 'text-green-400'}`}>₹{selectedSupplier.balance.toLocaleString()}</p>
                                </div>
                            </div>

                            {/* Add Payment Form */}
                            <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                                <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <CreditCard className="h-5 w-5 text-indigo-400" /> Record New Payment
                                </h4>
                                <form onSubmit={handleAddPayment} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-1">Amount</label>
                                        <div className="relative">
                                            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                            <input required type="number" value={paymentData.amount} onChange={e => setPaymentData({ ...paymentData, amount: e.target.value })}
                                                className="w-full bg-slate-900 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-white text-sm" placeholder="0.00" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-1">Mode</label>
                                        <select value={paymentData.paymentMode} onChange={e => setPaymentData({ ...paymentData, paymentMode: e.target.value })}
                                            className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-white text-sm">
                                            <option value="CASH">Cash</option>
                                            <option value="UPI">UPI</option>
                                            <option value="BANK_TRANSFER">Bank Transfer</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-1">Reference (Optional)</label>
                                        <input value={paymentData.referenceNo} onChange={e => setPaymentData({ ...paymentData, referenceNo: e.target.value })}
                                            className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-white text-sm" placeholder="Ref No." />
                                    </div>
                                    <button disabled={isSavingPayment} type="submit" className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-xl transition-all text-sm font-medium">
                                        {isSavingPayment ? 'Recording...' : 'Record Payment'}
                                    </button>
                                </form>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Purchase History */}
                                <div>
                                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                        <History className="h-5 w-5 text-indigo-400" /> Purchase History
                                    </h4>
                                    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-white/5">
                                                <tr className="text-gray-400 text-xs uppercase">
                                                    <th className="text-left px-4 py-2">Date</th>
                                                    <th className="text-right px-4 py-2">Total</th>
                                                    <th className="text-right px-4 py-2">Paid</th>
                                                    <th className="text-center px-4 py-2">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {selectedSupplier.purchases?.map((p: any) => (
                                                    <tr key={p.id}>
                                                        <td className="px-4 py-2 text-white">{format(new Date(p.orderDate), 'dd MMM yyyy')}</td>
                                                        <td className="px-4 py-2 text-right text-white font-medium">₹{p.totalAmount.toLocaleString()}</td>
                                                        <td className="px-4 py-2 text-right text-green-400">₹{p.amountPaid.toLocaleString()}</td>
                                                        <td className="px-4 py-2 text-center">
                                                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${p.paymentStatus === 'PAID' ? 'bg-green-500/20 text-green-400' : p.paymentStatus === 'PARTIAL' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                                                                {p.paymentStatus}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Payment History */}
                                <div>
                                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                        <Receipt className="h-5 w-5 text-indigo-400" /> Payment History
                                    </h4>
                                    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-white/5">
                                                <tr className="text-gray-400 text-xs uppercase">
                                                    <th className="text-left px-4 py-2">Date</th>
                                                    <th className="text-left px-4 py-2">Mode</th>
                                                    <th className="text-right px-4 py-2">Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {selectedSupplier.supplierPayments?.map((pay: any) => (
                                                    <tr key={pay.id}>
                                                        <td className="px-4 py-2 text-white">{format(new Date(pay.date), 'dd MMM yyyy')}</td>
                                                        <td className="px-4 py-2">
                                                            <span className="text-gray-400 text-xs block">{pay.paymentMode}</span>
                                                            {pay.referenceNo && <span className="text-[10px] text-gray-600 block">{pay.referenceNo}</span>}
                                                        </td>
                                                        <td className="px-4 py-2 text-right text-green-400 font-medium">₹{pay.amount.toLocaleString()}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-white/5 border-t border-white/10 flex justify-end">
                            <button onClick={() => setShowDetailModal(false)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-xl transition-all">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
