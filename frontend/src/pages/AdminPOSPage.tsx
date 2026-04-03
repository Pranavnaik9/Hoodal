import { useState, useEffect } from 'react';
import { Package, Search, Plus, Minus, Trash2, CreditCard, Banknote, Smartphone, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../lib/api';
import { Product } from '../types';

interface CartItem extends Product {
    cartQuantity: number;
}

export function AdminPOSPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('CASH'); // CASH, CARD, UPI

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await apiClient.get('/products');
            setProducts(res.data);
        } catch (error) {
            toast.error('Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    const addToCart = (product: Product) => {
        if (!product.isActive || product.stockQuantity <= 0) {
            toast.error('Product unavailable or out of stock');
            return;
        }

        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                if (existing.cartQuantity >= product.stockQuantity) {
                    toast.error('Cannot exceed available stock');
                    return prev;
                }
                return prev.map(item =>
                    item.id === product.id
                        ? { ...item, cartQuantity: item.cartQuantity + 1 }
                        : item
                );
            }
            return [...prev, { ...product, cartQuantity: 1 }];
        });
    };

    const updateQuantity = (productId: string, delta: number) => {
        setCart(prev => {
            return prev.map(item => {
                if (item.id === productId) {
                    const newQty = item.cartQuantity + delta;
                    if (newQty <= 0) return item; // Handled by remove
                    if (newQty > item.stockQuantity) {
                        toast.error('Cannot exceed available stock');
                        return item;
                    }
                    return { ...item, cartQuantity: newQty };
                }
                return item;
            });
        });
    };

    const removeFromCart = (productId: string) => {
        setCart(prev => prev.filter(item => item.id !== productId));
    };

    const clearCart = () => {
        if (window.confirm('Are you sure you want to clear the cart?')) {
            setCart([]);
        }
    };

    const handleCheckout = async () => {
        if (cart.length === 0) {
            toast.error('Cart is empty');
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                items: cart.map(item => ({
                    productId: item.id,
                    quantity: item.cartQuantity
                })),
                paymentMethod,
                paymentStatus: 'PAID'
            };

            await apiClient.post('/orders/admin/pos', payload);
            toast.success('Sale completed successfully!');
            setCart([]);
            fetchProducts(); // Refresh stock
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to complete sale');
        } finally {
            setSubmitting(false);
        }
    };

    // Calculations
    const grandTotal = cart.reduce((sum, item) => sum + (item.price * item.cartQuantity), 0);
    const totalGst = cart.reduce((sum, item) => {
        // @ts-ignore
        const rate = item.gstRate || 0;
        const inclusivePrice = item.price * item.cartQuantity;
        const basePrice = inclusivePrice / (1 + rate / 100);
        return sum + (inclusivePrice - basePrice);
    }, 0);
    const subtotal = grandTotal - totalGst;

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category?.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-80px)]">
            {/* Left Side: Products Grid */}
            <div className="flex-1 flex flex-col bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-white/10">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredProducts.map(product => (
                            <button
                                key={product.id}
                                onClick={() => addToCart(product)}
                                disabled={!product.isActive || product.stockQuantity <= 0}
                                className={`flex flex-col rounded-xl border text-left overflow-hidden transition-all ${!product.isActive || product.stockQuantity <= 0
                                    ? 'opacity-50 border-white/5 bg-white/5 cursor-not-allowed'
                                    : 'border-white/10 bg-white/5 hover:border-indigo-500 hover:bg-white/10 cursor-pointer'
                                    }`}
                            >
                                <div className="h-32 w-full bg-white/5 flex items-center justify-center relative">
                                    {product.imageUrl ? (
                                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <Package className="h-10 w-10 text-gray-500" />
                                    )}
                                    {product.stockQuantity <= 0 && (
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                            <span className="text-white font-medium text-sm">Out of Stock</span>
                                        </div>
                                    )}
                                </div>
                                <div className="p-3">
                                    <h3 className="text-white font-medium text-sm line-clamp-2 mb-1">{product.name}</h3>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-indigo-400 font-bold">₹{product.price.toFixed(2)}</span>
                                        <span className="text-gray-500 text-xs">Qty: {product.stockQuantity}</span>
                                    </div>
                                    {/* @ts-ignore */}
                                    {product.gstRate > 0 && <div className="text-xs text-gray-500 mt-1">GST: {product.gstRate}%</div>}
                                </div>
                            </button>
                        ))}
                    </div>
                    {filteredProducts.length === 0 && (
                        <div className="text-center text-gray-400 py-10">
                            No products found.
                        </div>
                    )}
                </div>
            </div>

            {/* Right Side: Cart / Checkout */}
            <div className="w-full lg:w-96 flex flex-col bg-white/5 border border-white/10 rounded-2xl overflow-hidden shrink-0">
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5 text-indigo-400" />
                        Current Order
                    </h2>
                    {cart.length > 0 && (
                        <button onClick={clearCart} className="text-red-400 hover:text-red-300 text-sm">Clear</button>
                    )}
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-2">
                            <ShoppingBag className="w-12 h-12 opacity-20" />
                            <p>Cart is empty</p>
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.id} className="flex flex-col bg-white/5 border border-white/10 rounded-xl p-3">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="text-white text-sm font-medium pr-2">{item.name}</h4>
                                    <button onClick={() => removeFromCart(item.id)} className="text-gray-500 hover:text-red-400">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2 bg-white/10 rounded-lg p-1">
                                        <button
                                            onClick={() => updateQuantity(item.id, -1)}
                                            className="p-1 rounded bg-white/5 hover:bg-white/10 text-white disabled:opacity-50"
                                            disabled={item.cartQuantity <= 1}
                                        >
                                            <Minus className="w-3 h-3" />
                                        </button>
                                        <span className="text-white text-sm w-6 text-center">{item.cartQuantity}</span>
                                        <button
                                            onClick={() => updateQuantity(item.id, 1)}
                                            className="p-1 rounded bg-white/5 hover:bg-white/10 text-white disabled:opacity-50"
                                            disabled={item.cartQuantity >= item.stockQuantity}
                                        >
                                            <Plus className="w-3 h-3" />
                                        </button>
                                    </div>
                                    {/* @ts-ignore */}
                                    <div className="text-right">
                                        <div className="text-white font-medium">₹{(item.price * item.cartQuantity).toFixed(2)}</div>
                                        {/* @ts-ignore */}
                                        {(item.gstRate || 0) > 0 && (
                                            <div className="text-[10px] text-gray-500">
                                                Incl. GST: ₹{((item.price * item.cartQuantity) - ((item.price * item.cartQuantity) / (1 + (item.gstRate || 0) / 100))).toFixed(2)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Summary & Checkout */}
                <div className="p-4 border-t border-white/10 bg-white/5 space-y-4">
                    <div className="space-y-2">
                        <div className="flex justify-between text-gray-400 text-sm">
                            <span>Excl. Tax Subtotal</span>
                            <span>₹{subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-gray-400 text-sm">
                            <span>Total GST (Included)</span>
                            <span>₹{totalGst.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-white font-bold text-lg pt-2 border-t border-white/10">
                            <span>Total</span>
                            <span className="text-indigo-400">₹{grandTotal.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="space-y-2 pt-2">
                        <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Payment Method</label>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                onClick={() => setPaymentMethod('CASH')}
                                className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${paymentMethod === 'CASH'
                                    ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400'
                                    : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                                    }`}
                            >
                                <Banknote className="w-5 h-5 mb-1" />
                                <span className="text-xs font-medium">Cash</span>
                            </button>
                            <button
                                onClick={() => setPaymentMethod('CARD')}
                                className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${paymentMethod === 'CARD'
                                    ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400'
                                    : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                                    }`}
                            >
                                <CreditCard className="w-5 h-5 mb-1" />
                                <span className="text-xs font-medium">Card</span>
                            </button>
                            <button
                                onClick={() => setPaymentMethod('UPI')}
                                className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${paymentMethod === 'UPI'
                                    ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400'
                                    : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                                    }`}
                            >
                                <Smartphone className="w-5 h-5 mb-1" />
                                <span className="text-xs font-medium">UPI</span>
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={handleCheckout}
                        disabled={cart.length === 0 || submitting}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-bold text-lg hover:from-indigo-500 hover:to-purple-500 transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)]"
                    >
                        {submitting ? 'Processing...' : `Charge ₹${grandTotal.toFixed(2)}`}
                    </button>
                </div>
            </div>
        </div>
    );
}
