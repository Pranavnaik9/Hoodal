import { useState, useEffect } from 'react';
import { Package, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../lib/api';
import { Order } from '../types';

export function AdminOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => { fetchOrders(); }, []);

    const fetchOrders = async () => {
        try {
            const res = await apiClient.get('/orders/admin/all');
            setOrders(res.data.data || []);
        } catch { toast.error('Failed to load orders'); }
        finally { setLoading(false); }
    };

    const updateStatus = async (orderId: string, status: string) => {
        try {
            await apiClient.put(`/orders/admin/${orderId}`, { status });
            fetchOrders();
            toast.success(`Order ${status.toLowerCase()}`);
        } catch (e: any) { toast.error(e.response?.data?.message || 'Update failed'); }
    };

    const statusColor = (s: string) => {
        const m: Record<string, string> = { PENDING: 'bg-yellow-500/20 text-yellow-400', OUT_FOR_DELIVERY: 'bg-indigo-500/20 text-indigo-400', DELIVERED: 'bg-emerald-500/20 text-emerald-400', CANCELLED: 'bg-red-500/20 text-red-400' };
        return m[s] || 'bg-gray-500/20 text-gray-400';
    };

    const filtered = orders.filter(o => !statusFilter || o.status === statusFilter);
    const statuses = ['PENDING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];

    if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent"></div></div>;

    return (
        <div>
            <h2 className="text-2xl font-bold text-white mb-6">Online Orders</h2>

            {/* Stats */}
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-6">
                <button onClick={() => setStatusFilter('')} className={`text-center p-2 rounded-xl text-xs transition-colors ${!statusFilter ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-white/5 text-gray-400 border border-white/10 hover:border-indigo-500/20'}`}>
                    All ({orders.length})
                </button>
                {statuses.map(s => (
                    <button key={s} onClick={() => setStatusFilter(s)} className={`text-center p-2 rounded-xl text-xs transition-colors ${statusFilter === s ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-white/5 text-gray-400 border border-white/10 hover:border-indigo-500/20'}`}>
                        {s} ({orders.filter(o => o.status === s).length})
                    </button>
                ))}
            </div>

            {filtered.length === 0 ? (
                <div className="text-center py-12"><p className="text-gray-500">No orders</p></div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(order => (
                        <div key={order.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                            <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors" onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}>
                                <div className="flex items-center gap-4">
                                    <div className="bg-indigo-500/20 p-2 rounded-lg"><Package className="h-5 w-5 text-indigo-400" /></div>
                                    <div>
                                        <p className="text-white font-medium text-sm">{order.orderNumber}</p>
                                        <p className="text-gray-500 text-xs">{order.user?.firstName} {order.user?.lastName} • {new Date(order.createdAt).toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-white font-bold">₹{Number(order.total).toFixed(0)}</span>
                                    <span className={`text-xs px-2.5 py-1 rounded-full ${statusColor(order.status)}`}>{order.status}</span>
                                    <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${expandedId === order.id ? 'rotate-180' : ''}`} />
                                </div>
                            </div>

                            {expandedId === order.id && (
                                <div className="border-t border-white/10 p-4">
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <h4 className="text-gray-400 text-xs mb-1">Customer</h4>
                                            <p className="text-white text-sm">{order.user?.firstName} {order.user?.lastName}</p>
                                            <p className="text-gray-500 text-xs">{order.user?.email}</p>
                                        </div>
                                        <div>
                                            <h4 className="text-gray-400 text-xs mb-1">Delivery</h4>
                                            <p className="text-white text-sm">{order.deliveryName} • {order.deliveryPhone}</p>
                                            <p className="text-gray-500 text-xs">{order.deliveryAddress}, {order.deliveryCity}</p>
                                            {order.deliverySlot && (
                                                <p className="text-indigo-400 text-xs mt-1 font-medium bg-indigo-500/10 px-2 py-0.5 rounded inline-block">
                                                    Slot: {order.deliverySlot}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <h4 className="text-gray-400 text-xs mb-2">Items</h4>
                                    <div className="space-y-1 mb-4">
                                        {order.OrderItem?.map(item => (
                                            <div key={item.id} className="flex justify-between text-sm bg-white/5 rounded-lg px-3 py-2">
                                                <span className="text-gray-300">{item.productName} × {item.quantity}</span>
                                                <span className="text-white">₹{(Number(item.price) * item.quantity).toFixed(0)}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
                                        <div className="flex gap-2">
                                            {order.status === 'PENDING' && <button onClick={() => updateStatus(order.id, 'OUT_FOR_DELIVERY')} className="bg-indigo-600/20 text-indigo-400 px-3 py-1.5 rounded-lg text-xs hover:bg-indigo-600/30">Out for Delivery</button>}
                                            <button onClick={() => updateStatus(order.id, 'CANCELLED')} className="bg-red-600/20 text-red-400 px-3 py-1.5 rounded-lg text-xs hover:bg-red-600/30">Cancel</button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
