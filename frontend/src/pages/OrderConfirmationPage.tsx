import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, Package, ArrowRight, Store } from 'lucide-react';
import apiClient from '../lib/api';
import { Order } from '../types';

export function OrderConfirmationPage() {
    const { id } = useParams<{ id: string }>();
    const [order, setOrder] = useState<Order | null>(null);

    useEffect(() => {
        if (id) apiClient.get(`/orders/${id}`).then(r => setOrder(r.data.data || r.data)).catch(() => { });
    }, [id]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-10 max-w-lg w-full text-center">
                <div className="bg-emerald-500/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="h-10 w-10 text-emerald-400" />
                </div>

                <h1 className="text-3xl font-bold text-white mb-2">Order Placed!</h1>
                <p className="text-gray-400 mb-6">Your order has been placed successfully.</p>

                {order && (
                    <div className="bg-white/5 rounded-xl p-4 mb-6 text-left">
                        <div className="flex justify-between mb-2">
                            <span className="text-gray-400 text-sm">Order Number</span>
                            <span className="text-white font-mono text-sm">{order.orderNumber}</span>
                        </div>
                        {order.shop && (
                            <div className="flex justify-between mb-2">
                                <span className="text-gray-400 text-sm">Shop</span>
                                <span className="text-white text-sm flex items-center gap-1"><Store className="h-3 w-3 text-indigo-400" /> {order.shop.name}</span>
                            </div>
                        )}
                        <div className="flex justify-between">
                            <span className="text-gray-400 text-sm">Total</span>
                            <span className="text-indigo-400 font-bold">₹{Number(order.total).toFixed(0)}</span>
                        </div>
                    </div>
                )}

                <div className="flex gap-3 justify-center">
                    <Link to="/orders" className="bg-white/10 text-white px-6 py-2.5 rounded-xl hover:bg-white/20 transition-colors flex items-center gap-2">
                        <Package className="h-4 w-4" /> View Orders
                    </Link>
                    <Link to="/marketplace" className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2.5 rounded-xl hover:from-indigo-500 hover:to-purple-500 transition-all flex items-center gap-2">
                        Continue Shopping <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
