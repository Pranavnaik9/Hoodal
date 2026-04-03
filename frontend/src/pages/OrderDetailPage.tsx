import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Store, MapPin, CreditCard } from 'lucide-react';
import apiClient from '../lib/api';
import { Order } from '../types';

export function OrderDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) apiClient.get(`/orders/${id}`).then(r => setOrder(r.data.data || r.data)).catch(() => navigate('/orders')).finally(() => setLoading(false));
    }, [id]);

    const statusColor = (s: string) => {
        const m: Record<string, string> = { PENDING: 'text-yellow-400', OUT_FOR_DELIVERY: 'text-indigo-400', DELIVERED: 'text-emerald-400', CANCELLED: 'text-red-400' };
        return m[s] || 'text-gray-400';
    };

    if (loading) {
        return <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
        </div>;
    }

    if (!order) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
            <div className="max-w-3xl mx-auto">
                <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white flex items-center gap-1 mb-4"><ArrowLeft className="h-4 w-4" /> Back</button>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-white">{order.orderNumber}</h1>
                            <div className="flex items-center gap-2 mt-1">
                                {order.shop && <span className="text-gray-500 text-sm flex items-center gap-1"><Store className="h-3 w-3" /> {order.shop.name}</span>}
                                <span className="text-gray-600 text-xs">{new Date(order.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                        <span className={`text-lg font-bold ${statusColor(order.status)}`}>{order.status}</span>
                    </div>

                    {/* Items */}
                    <h2 className="text-white font-semibold mb-3">Items</h2>
                    <div className="space-y-2 mb-6">
                        {order.OrderItem?.map(item => (
                            <div key={item.id} className="flex justify-between bg-white/5 rounded-lg p-3">
                                <div>
                                    <p className="text-white text-sm">{item.productName}</p>
                                    <p className="text-gray-500 text-xs">Qty: {item.quantity} × ₹{Number(item.price).toFixed(0)}</p>
                                </div>
                                <p className="text-white font-medium">₹{(Number(item.price) * item.quantity).toFixed(0)}</p>
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-white/10 pt-4 mb-6">
                        <div className="flex justify-between mb-1"><span className="text-gray-400">Subtotal</span><span className="text-white">₹{Number(order.subtotal).toFixed(0)}</span></div>
                        <div className="flex justify-between mb-1"><span className="text-gray-400">Tax</span><span className="text-white">₹{Number(order.tax).toFixed(0)}</span></div>
                        <div className="flex justify-between text-lg font-bold"><span className="text-white">Total</span><span className="text-indigo-400">₹{Number(order.total).toFixed(0)}</span></div>
                    </div>

                    {order.status === 'OUT_FOR_DELIVERY' && (
                        <div className="mb-6 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-between">
                            <div>
                                <h3 className="text-white font-medium">Order is out for delivery!</h3>
                                <p className="text-gray-400 text-sm">Please confirm when you receive your items.</p>
                            </div>
                            <button
                                onClick={async () => {
                                    try {
                                        await apiClient.put(`/orders/${order.id}/confirm-delivery`);
                                        const res = await apiClient.get(`/orders/${order.id}`);
                                        setOrder(res.data.data || res.data);
                                    } catch (err) {
                                        console.error('Failed to confirm delivery', err);
                                    }
                                }}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                            >
                                Received Order
                            </button>
                        </div>
                    )}

                    {/* Delivery */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 rounded-xl p-4">
                            <h3 className="text-gray-400 text-sm mb-2 flex items-center gap-1"><MapPin className="h-4 w-4" /> Delivery</h3>
                            <p className="text-white text-sm">{order.deliveryName}</p>
                            <p className="text-gray-400 text-xs">{order.deliveryPhone}</p>
                            <p className="text-gray-400 text-xs">{order.deliveryAddress}, {order.deliveryCity}</p>
                            <p className="text-gray-400 text-xs">{order.deliveryState} - {order.deliveryPincode}</p>
                            {order.deliverySlot && (
                                <p className="mt-2 text-indigo-400 text-xs font-medium bg-indigo-500/10 px-2 py-1 rounded inline-block">
                                    Slot: {order.deliverySlot}
                                </p>
                            )}
                        </div>
                        <div className="bg-white/5 rounded-xl p-4">
                            <h3 className="text-gray-400 text-sm mb-2 flex items-center gap-1"><CreditCard className="h-4 w-4" /> Payment</h3>
                            <p className="text-white text-sm">{order.paymentMethod || 'Not specified'}</p>
                            <p className={`text-xs mt-1 ${order.paymentStatus === 'COMPLETED' ? 'text-emerald-400' : order.paymentStatus === 'FAILED' ? 'text-red-400' : 'text-yellow-400'}`}>
                                {order.paymentStatus}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
