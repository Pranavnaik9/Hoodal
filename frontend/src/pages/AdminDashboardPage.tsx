import { useState, useEffect } from 'react';
import { Package, ShoppingBag, TrendingUp, AlertCircle } from 'lucide-react';
import apiClient from '../lib/api';
import { useAuthStore } from '../store/authStore';

export default function AdminDashboardPage() {
    const { user } = useAuthStore();
    const [stats, setStats] = useState({ productCount: 0, orderCount: 0, totalRevenue: 0, pendingOrders: 0 });
    const [dailySummary, setDailySummary] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.shopId) {
            Promise.all([
                apiClient.get(`/shops/${user.shopId}/stats`),
                apiClient.get(`/shops/${user.shopId}/daily-summary`)
            ]).then(([statsRes, summaryRes]) => {
                setStats(statsRes.data.data);
                setDailySummary(summaryRes.data.data);
            }).catch(() => { }).finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [user]);

    if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent"></div></div>;

    const cards = [
        { label: 'Products', value: stats.productCount, icon: Package, color: 'indigo' },
        { label: 'Total Orders', value: stats.orderCount, icon: ShoppingBag, color: 'purple' },
        { label: 'Revenue', value: `₹${stats.totalRevenue.toLocaleString()}`, icon: TrendingUp, color: 'emerald' },
        { label: 'Pending', value: stats.pendingOrders, icon: AlertCircle, color: 'yellow' },
    ];

    return (
        <div>
            <h2 className="text-2xl font-bold text-white mb-6">Dashboard</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {cards.map(c => (
                    <div key={c.label} className="bg-white/5 border border-white/10 rounded-xl p-5">
                        <div className="flex items-center gap-3">
                            <div className={`bg-${c.color}-500/20 p-2.5 rounded-lg`}>
                                <c.icon className={`h-5 w-5 text-${c.color}-400`} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{c.value}</p>
                                <p className="text-gray-400 text-sm">{c.label}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {dailySummary && (
                <div>
                    <h3 className="text-xl font-bold text-white mb-4">Today's Summary</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                            <p className="text-gray-400 text-sm">Sales Today</p>
                            <p className="text-2xl font-bold text-emerald-400">₹{dailySummary.totalSalesToday}</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                            <p className="text-gray-400 text-sm">Purchases Today</p>
                            <p className="text-2xl font-bold text-indigo-400">₹{dailySummary.totalPurchasesToday}</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                            <p className="text-gray-400 text-sm">Expenses Today</p>
                            <p className="text-2xl font-bold text-rose-400">₹{dailySummary.totalExpensesToday}</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                            <p className="text-gray-400 text-sm">Net Balance</p>
                            <p className={`text-2xl font-bold ${dailySummary.netBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                ₹{dailySummary.netBalance}
                            </p>
                        </div>
                    </div>

                    <h3 className="text-xl font-bold text-white mb-4">Today's Orders</h3>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 overflow-hidden">
                        {dailySummary.allOrdersToday && dailySummary.allOrdersToday.length > 0 ? (
                            <table className="w-full">
                                <thead className="bg-white/5">
                                    <tr className="text-gray-400 text-xs uppercase">
                                        <th className="text-left px-4 py-3">Order ID</th>
                                        <th className="text-left px-4 py-3">Time</th>
                                        <th className="text-right px-4 py-3">Amount</th>
                                        <th className="text-center px-4 py-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {dailySummary.allOrdersToday.map((order: any) => (
                                        <tr key={order.id} className="text-sm">
                                            <td className="px-4 py-3 text-white font-mono">{order.id.slice(0, 8)}</td>
                                            <td className="px-4 py-3 text-gray-400">{new Date(order.createdAt).toLocaleTimeString()}</td>
                                            <td className="px-4 py-3 text-right text-emerald-400 font-medium">₹{order.total}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`text-xs px-2 py-1 rounded-full ${order.status === 'DELIVERED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p className="text-center text-gray-500 py-4">No incoming orders today.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
