import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash2, Plus, Minus, Store, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../lib/api';
import { Cart } from '../types';

export function CartPage() {
    const navigate = useNavigate();
    const [carts, setCarts] = useState<Cart[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchCarts(); }, []);

    const fetchCarts = async () => {
        try {
            const res = await apiClient.get('/cart');
            // Could be a single cart or array depending on endpoint
            const data = Array.isArray(res.data) ? res.data : (res.data.CartItem ? [res.data] : []);
            setCarts(data.filter((c: Cart) => c.CartItem && c.CartItem.length > 0));
        } catch { toast.error('Failed to load cart'); }
        finally { setLoading(false); }
    };

    const updateQty = async (itemId: string, quantity: number) => {
        try {
            if (quantity < 1) return removeItem(itemId);
            await apiClient.put(`/cart/items/${itemId}`, { quantity });
            fetchCarts();
        } catch (e: any) { toast.error(e.response?.data?.message || 'Update failed'); }
    };

    const removeItem = async (itemId: string) => {
        try {
            await apiClient.delete(`/cart/items/${itemId}`);
            fetchCarts();
            toast.success('Item removed');
        } catch { toast.error('Failed to remove'); }
    };

    const getCartTotal = (cart: Cart) =>
        cart.CartItem.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex justify-center items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                    <ShoppingCart className="h-8 w-8 text-indigo-400" /> Your Cart
                </h1>

                {carts.length === 0 ? (
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
                        <ShoppingCart className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400 text-lg mb-4">Your cart is empty</p>
                        <Link to="/marketplace" className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 justify-center">
                            Browse shops <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {carts.map(cart => (
                            <div key={cart.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                                {/* Shop header */}
                                <div className="bg-white/5 px-6 py-3 border-b border-white/10 flex items-center gap-2">
                                    <Store className="h-5 w-5 text-indigo-400" />
                                    <span className="text-white font-medium">{cart.shop?.name || 'Shop'}</span>
                                </div>

                                {/* Items */}
                                <div className="divide-y divide-white/5">
                                    {cart.CartItem.map(item => (
                                        <div key={item.id} className="px-6 py-4 flex items-center gap-4">
                                            <div className="w-16 h-16 bg-white/5 rounded-lg flex items-center justify-center flex-shrink-0">
                                                {item.product.imageUrl ? (
                                                    <img src={item.product.imageUrl} alt="" className="w-full h-full object-cover rounded-lg" />
                                                ) : (
                                                    <Store className="h-6 w-6 text-gray-600" />
                                                )}
                                            </div>

                                            <div className="flex-1">
                                                <h3 className="text-white text-sm font-medium">{item.product.name}</h3>
                                                <p className="text-indigo-400 text-sm">₹{item.price}</p>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button onClick={() => updateQty(item.id, item.quantity - 1)}
                                                    className="bg-white/10 p-1.5 rounded-lg hover:bg-white/20 text-gray-300">
                                                    <Minus className="h-4 w-4" />
                                                </button>
                                                <span className="text-white w-8 text-center">{item.quantity}</span>
                                                <button onClick={() => updateQty(item.id, item.quantity + 1)}
                                                    className="bg-white/10 p-1.5 rounded-lg hover:bg-white/20 text-gray-300">
                                                    <Plus className="h-4 w-4" />
                                                </button>
                                            </div>

                                            <p className="text-white font-medium w-20 text-right">₹{(Number(item.price) * item.quantity).toFixed(0)}</p>

                                            <button onClick={() => removeItem(item.id)} className="text-gray-500 hover:text-red-400">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {/* Footer */}
                                <div className="bg-white/5 px-6 py-4 flex items-center justify-between border-t border-white/10">
                                    <p className="text-gray-400">
                                        Subtotal: <span className="text-white font-bold text-lg">₹{getCartTotal(cart).toFixed(0)}</span>
                                    </p>
                                    <button
                                        onClick={() => navigate(`/checkout/${cart.shopId}`)}
                                        className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2.5 rounded-xl hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg shadow-indigo-500/25 flex items-center gap-2"
                                    >
                                        Checkout <ArrowRight className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
