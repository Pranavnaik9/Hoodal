import { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Edit } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../lib/api';

export function AdminExpensesPage() {
    const [expenses, setExpenses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);

    const [formData, setFormData] = useState({
        id: '',
        category: 'Rent',
        amount: '',
        paymentMode: 'Cash',
        referenceNo: '',
        date: new Date().toISOString().split('T')[0],
        description: ''
    });

    const categories = ['Rent', 'Salary', 'Electricity', 'Water', 'Internet', 'Marketing', 'Maintenance', 'Other'];
    const paymentModes = ['Cash', 'UPI', 'Bank Transfer', 'Credit Card', 'Debit Card'];

    const fetchExpenses = () => {
        setLoading(true);
        apiClient.get('/expenses')
            .then(res => setExpenses(res.data))
            .catch(() => toast.error('Failed to load expenses'))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchExpenses();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (formData.id) {
                await apiClient.put(`/expenses/${formData.id}`, formData);
                toast.success('Expense updated');
            } else {
                await apiClient.post('/expenses', formData);
                toast.success('Expense recorded');
            }
            setShowModal(false);
            fetchExpenses();
        } catch {
            toast.error('Failed to save expense');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this expense log?')) return;
        try {
            await apiClient.delete(`/expenses/${id}`);
            toast.success('Expense deleted');
            fetchExpenses();
        } catch {
            toast.error('Failed to delete expense');
        }
    };

    const filtered = expenses.filter(e =>
        !search ||
        e.category.toLowerCase().includes(search.toLowerCase()) ||
        (e.description && e.description.toLowerCase().includes(search.toLowerCase()))
    );

    if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent"></div></div>;

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Expenses</h2>
                <button onClick={() => {
                    setFormData({ id: '', category: 'Rent', amount: '', paymentMode: 'Cash', referenceNo: '', date: new Date().toISOString().split('T')[0], description: '' });
                    setShowModal(true);
                }} className="bg-gradient-to-r from-red-600 to-rose-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:from-red-500 hover:to-rose-500 transition-all text-sm">
                    <Plus className="h-4 w-4" /> Log Expense
                </button>
            </div>

            <div className="flex gap-3 mb-6">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by category or description..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-rose-500" />
                </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <div className="table-responsive">
                <table className="w-full">
                    <thead className="bg-white/5">
                        <tr className="text-gray-400 text-xs uppercase">
                            <th className="text-left px-4 py-3">Date</th>
                            <th className="text-left px-4 py-3">Category</th>
                            <th className="text-left px-4 py-3">Description</th>
                            <th className="text-left px-4 py-3">Payment Info</th>
                            <th className="text-right px-4 py-3">Amount</th>
                            <th className="text-right px-4 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filtered.map(expense => (
                            <tr key={expense.id} className="hover:bg-white/5 transition-colors">
                                <td className="px-4 py-3 text-white text-sm">{new Date(expense.date).toLocaleDateString()}</td>
                                <td className="px-4 py-3">
                                    <span className="bg-rose-500/20 text-rose-400 text-xs px-2 py-1 rounded-full">
                                        {expense.category}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-gray-300 text-sm">{expense.description || '-'}</td>
                                <td className="px-4 py-3">
                                    <div className="text-sm text-gray-300">{expense.paymentMode}</div>
                                    <div className="text-xs text-gray-500">{expense.referenceNo || 'No ref'}</div>
                                </td>
                                <td className="px-4 py-3 text-right text-rose-400 font-medium">₹{expense.amount}</td>
                                <td className="px-4 py-3 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button onClick={() => {
                                            setFormData({
                                                id: expense.id,
                                                category: expense.category,
                                                amount: expense.amount,
                                                paymentMode: expense.paymentMode,
                                                referenceNo: expense.referenceNo || '',
                                                date: new Date(expense.date).toISOString().split('T')[0],
                                                description: expense.description || ''
                                            });
                                            setShowModal(true);
                                        }} className="text-gray-400 hover:text-indigo-400"><Edit className="h-4 w-4" /></button>
                                        <button onClick={() => handleDelete(expense.id)} className="text-gray-400 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                </div>
                {filtered.length === 0 && <p className="text-center text-gray-500 py-8">No expenses logged yet</p>}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-800 rounded-2xl w-full max-w-md border border-white/10 p-6">
                        <h3 className="text-xl font-bold text-white mb-6">{formData.id ? 'Edit Expense' : 'Log Expense'}</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Date</label>
                                    <input type="date" required value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Amount</label>
                                    <input type="number" min="0" required value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} placeholder="e.g. 5000" className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-white" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
                                    <select required value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-white">
                                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Payment Mode</label>
                                    <select required value={formData.paymentMode} onChange={e => setFormData({ ...formData, paymentMode: e.target.value })} className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-white">
                                        {paymentModes.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Reference No (Txn ID)</label>
                                <input value={formData.referenceNo} onChange={e => setFormData({ ...formData, referenceNo: e.target.value })} placeholder="e.g. UPI Ref" className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-white" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                                <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Notes about this expense" className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-white h-20 resize-none"></textarea>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl transition-colors">Cancel</button>
                                <button type="submit" className="flex-1 bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-xl transition-colors">Save Expense</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
