import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Store, Eye } from 'lucide-react';
import apiClient from '../lib/api';
import { Order } from '../types';
import toast from 'react-hot-toast';

export function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiClient.get('/orders').then(r => setOrders(r.data.data || r.data)).catch(() => { }).finally(() => setLoading(false));
    }, []);

    const statusColor = (s: string) => {
        const m: Record<string, string> = {
            PENDING: 'bg-yellow-500/20 text-yellow-400',
            OUT_FOR_DELIVERY: 'bg-indigo-500/20 text-indigo-400',
            DELIVERED: 'bg-emerald-500/20 text-emerald-400',
            CANCELLED: 'bg-red-500/20 text-red-400',
        };
        return m[s] || 'bg-gray-500/20 text-gray-400';
    };

    if (loading) {
        return <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
        </div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                    <Package className="h-8 w-8 text-indigo-400" /> My Orders
                </h1>

                {orders.length === 0 ? (
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
                        <Package className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400 text-lg">No orders yet</p>
                        <Link to="/marketplace" className="text-indigo-400 text-sm mt-2 inline-block">Browse shops →</Link>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {orders.map(order => (
                            <Link
                                key={order.id}
                                to={`/orders/${order.id}`}
                                className="bg-white/5 border border-white/10 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-indigo-500/30 transition-colors block"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="bg-indigo-500/20 p-2.5 rounded-lg">
                                        <Package className="h-5 w-5 text-indigo-400" />
                                    </div>
                                    <div>
                                        <p className="text-white font-medium text-sm">{order.orderNumber}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            {order.shop && (
                                                <span className="text-gray-500 text-xs flex items-center gap-1">
                                                    <Store className="h-3 w-3" /> {order.shop.name}
                                                </span>
                                            )}
                                            <span className="text-gray-600 text-xs">
                                                {new Date(order.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <span className="text-white font-bold">₹{Number(order.total).toFixed(0)}</span>
                                    {order.status === 'OUT_FOR_DELIVERY' ? (
                                        <button
                                            onClick={async (e) => {
                                                e.preventDefault();
                                                try {
                                                    await apiClient.put(`/orders/${order.id}/confirm-delivery`);
                                                    toast.success('Thanks for confirming!');
                                                    apiClient.get('/orders').then(r => setOrders(r.data.data || r.data));
                                                } catch (err) {
                                                    toast.error('Failed to confirm delivery');
                                                }
                                            }}
                                            className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
                                        >
                                            Received Order
                                        </button>
                                    ) : (
                                        <span className={`text-xs px-2.5 py-1 rounded-full ${statusColor(order.status)}`}>
                                            {order.status}
                                        </span>
                                    )}
                                    <Eye className="h-4 w-4 text-gray-500" />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
