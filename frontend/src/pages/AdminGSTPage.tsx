import { useState, useEffect } from 'react';
import { Calculator, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../lib/api';
import { useAuthStore } from '../store/authStore';

export function AdminGSTPage() {
    const { user } = useAuthStore();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => { fetchGST(); }, []);

    const fetchGST = async (start?: string, end?: string) => {
        if (!user?.shopId) return;
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (start) params.set('startDate', start);
            if (end) params.set('endDate', end);
            const res = await apiClient.get(`/shops/${user.shopId}/gst-summary?${params.toString()}`);
            setData(res.data.data);
        } catch { toast.error('Failed to load GST data'); }
        finally { setLoading(false); }
    };

    const handleFilter = () => fetchGST(startDate, endDate);

    const allSlabRates = data ? [...new Set([
        ...Object.keys(data.salesSlabs || {}).map(Number),
        ...Object.keys(data.purchaseSlabs || {}).map(Number),
    ])].sort((a, b) => a - b) : [];

    if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent"></div></div>;

    return (
        <div>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Calculator className="w-7 h-7 text-indigo-400" /> GST Calculations
            </h2>

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

            {data && (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                            <p className="text-gray-400 text-sm">Total Sales Value</p>
                            <p className="text-2xl font-bold text-white">₹{data.totalSalesValue?.toFixed(2)}</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                            <div className="flex items-center gap-2 mb-1"><TrendingUp className="w-4 h-4 text-emerald-400" /><p className="text-gray-400 text-sm">GST Collected (Sales)</p></div>
                            <p className="text-2xl font-bold text-emerald-400">₹{data.salesGST?.toFixed(2)}</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                            <div className="flex items-center gap-2 mb-1"><TrendingDown className="w-4 h-4 text-indigo-400" /><p className="text-gray-400 text-sm">GST Paid (Purchases / ITC)</p></div>
                            <p className="text-2xl font-bold text-indigo-400">₹{data.purchaseGST?.toFixed(2)}</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                            <p className="text-gray-400 text-sm">Net GST Liability</p>
                            <p className={`text-2xl font-bold ${data.netLiability >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                ₹{data.netLiability?.toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">{data.netLiability >= 0 ? 'Amount payable to Govt' : 'ITC excess — carry forward'}</p>
                        </div>
                    </div>

                    {/* Slab-wise Breakdown */}
                    {allSlabRates.length > 0 && (
                        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                            <h3 className="text-lg font-bold text-white p-4 border-b border-white/10">GST Slab-wise Breakdown</h3>
                            <div className="table-responsive">
                            <table className="w-full">
                                <thead className="bg-white/5">
                                    <tr className="text-gray-400 text-xs uppercase">
                                        <th className="text-left px-4 py-3">GST Rate</th>
                                        <th className="text-right px-4 py-3">Sales Taxable Value</th>
                                        <th className="text-right px-4 py-3">Sales GST</th>
                                        <th className="text-right px-4 py-3">Purchase Taxable Value</th>
                                        <th className="text-right px-4 py-3">Purchase GST (ITC)</th>
                                        <th className="text-right px-4 py-3">Net</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {allSlabRates.map(rate => {
                                        const s = data.salesSlabs?.[rate] || { taxableValue: 0, gstAmount: 0 };
                                        const p = data.purchaseSlabs?.[rate] || { taxableValue: 0, gstAmount: 0 };
                                        const net = s.gstAmount - p.gstAmount;
                                        return (
                                            <tr key={rate} className="hover:bg-white/5 transition-colors text-sm">
                                                <td className="px-4 py-3 text-white font-medium">{rate}%</td>
                                                <td className="px-4 py-3 text-right text-gray-300">₹{s.taxableValue.toFixed(2)}</td>
                                                <td className="px-4 py-3 text-right text-emerald-400">₹{s.gstAmount.toFixed(2)}</td>
                                                <td className="px-4 py-3 text-right text-gray-300">₹{p.taxableValue.toFixed(2)}</td>
                                                <td className="px-4 py-3 text-right text-indigo-400">₹{p.gstAmount.toFixed(2)}</td>
                                                <td className={`px-4 py-3 text-right font-medium ${net >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>₹{net.toFixed(2)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
