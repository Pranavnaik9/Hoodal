import { useState, useEffect } from 'react';
import { Receipt, ChevronDown, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../lib/api';

export function AdminPOSSalesPage() {
    const [sales, setSales] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => { fetchSales(); }, []);

    const fetchSales = async (start?: string, end?: string) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (start) params.set('startDate', start);
            if (end) params.set('endDate', end);
            const res = await apiClient.get(`/orders/admin/pos-sales?${params.toString()}`);
            setSales(res.data.data || []);
        } catch { toast.error('Failed to load POS sales'); }
        finally { setLoading(false); }
    };

    const handleFilter = () => {
        fetchSales(startDate, endDate);
    };

    const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);
    const totalTax = sales.reduce((sum, s) => sum + (s.tax || 0), 0);

    if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent"></div></div>;

    return (
        <div>
            <h2 className="text-2xl font-bold text-white mb-6">POS Sales History</h2>

            {/* Date Filter */}
            <div className="flex flex-wrap gap-3 mb-6 items-end">
                <div>
                    <label className="text-xs text-gray-400 block mb-1">From</label>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm" />
                </div>
                <div>
                    <label className="text-xs text-gray-400 block mb-1">To</label>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm" />
                </div>
                <button onClick={handleFilter} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm flex items-center gap-1">
                    <Calendar className="w-4 h-4" /> Filter
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                    <p className="text-gray-400 text-sm">Total Sales</p>
                    <p className="text-2xl font-bold text-emerald-400">₹{totalRevenue.toFixed(2)}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                    <p className="text-gray-400 text-sm">Total GST Collected</p>
                    <p className="text-2xl font-bold text-indigo-400">₹{totalTax.toFixed(2)}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                    <p className="text-gray-400 text-sm">Number of Sales</p>
                    <p className="text-2xl font-bold text-white">{sales.length}</p>
                </div>
            </div>

            {/* Sales List */}
            {sales.length === 0 ? (
                <div className="text-center py-12"><p className="text-gray-500">No POS sales found</p></div>
            ) : (
                <div className="space-y-3">
                    {sales.map(sale => (
                        <div key={sale.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                            <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                                onClick={() => setExpandedId(expandedId === sale.id ? null : sale.id)}>
                                <div className="flex items-center gap-4">
                                    <div className="bg-emerald-500/20 p-2 rounded-lg"><Receipt className="h-5 w-5 text-emerald-400" /></div>
                                    <div>
                                        <p className="text-white font-medium text-sm">{sale.orderNumber}</p>
                                        <p className="text-gray-500 text-xs">{new Date(sale.createdAt).toLocaleString()} • {sale.paymentMethod}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-white font-bold">₹{Number(sale.total).toFixed(2)}</span>
                                    {sale.tax > 0 && <span className="text-xs text-gray-500">GST: ₹{Number(sale.tax).toFixed(2)}</span>}
                                    <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${expandedId === sale.id ? 'rotate-180' : ''}`} />
                                </div>
                            </div>

                            {expandedId === sale.id && (
                                <div className="border-t border-white/10 p-4">
                                    <h4 className="text-gray-400 text-xs mb-2">Items</h4>
                                    <div className="space-y-1 mb-3">
                                        {sale.OrderItem?.map((item: any) => (
                                            <div key={item.id} className="flex justify-between text-sm bg-white/5 rounded-lg px-3 py-2">
                                                <span className="text-gray-300">{item.productName} × {item.quantity}</span>
                                                <div className="text-right">
                                                    <span className="text-white">₹{(Number(item.price) * item.quantity).toFixed(2)}</span>
                                                    {item.gstRate > 0 && <span className="text-xs text-gray-500 ml-2">({item.gstRate}% GST)</span>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                        <div><span className="text-gray-500">Subtotal:</span> <span className="text-white ml-1">₹{Number(sale.subtotal).toFixed(2)}</span></div>
                                        <div><span className="text-gray-500">GST:</span> <span className="text-indigo-400 ml-1">₹{Number(sale.tax).toFixed(2)}</span></div>
                                        <div><span className="text-gray-500">Payment:</span> <span className="text-emerald-400 ml-1">{sale.paymentMethod}</span></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
