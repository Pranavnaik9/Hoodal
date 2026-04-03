import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Store, ArrowRight, ShoppingBag, TrendingUp } from 'lucide-react';
import apiClient from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { Shop } from '../types';

export function HomePage() {
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuthStore();
    const [shops, setShops] = useState<Shop[]>([]);

    useEffect(() => {
        // Redirect based on role
        if (isAuthenticated) {
            if (user?.role === 'HOODAL_ADMIN') {
                navigate('/hoodal-admin');
                return;
            }
            if (user?.role === 'SHOP_ADMIN') {
                navigate('/admin');
                return;
            }
        }
        fetchShops();
    }, [isAuthenticated, user]);

    const fetchShops = async () => {
        try {
            const res = await apiClient.get('/shops');
            setShops((res.data.data || []).slice(0, 3));
        } catch { }
    };

    const colors = [
        'from-indigo-500 to-purple-600',
        'from-emerald-500 to-teal-600',
        'from-orange-500 to-rose-600',
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            {/* Hero */}
            <div className="relative overflow-hidden">
                <div className="absolute inset-0">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                    <div className="absolute top-40 right-1/3 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
                </div>

                <div className="relative max-w-7xl mx-auto px-4 py-24 sm:py-32 text-center">
                    <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-1.5 rounded-full text-sm text-indigo-300 mb-6">
                        <ShoppingBag className="h-4 w-4" />
                        Your neighbourhood marketplace
                    </div>

                    <h1 className="text-6xl sm:text-7xl font-bold mb-6">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                            Shop Local,
                        </span>
                        <br />
                        <span className="text-white">Shop Smart</span>
                    </h1>

                    <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
                        Discover stores in your neighbourhood. Browse their catalogues, add to cart, and get your favourite products — all from <strong className="text-indigo-400">HOODAL</strong>.
                    </p>

                    <div className="flex gap-4 justify-center">
                        <Link
                            to="/marketplace"
                            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3.5 rounded-xl text-lg font-medium hover:from-indigo-500 hover:to-purple-500 transition-all shadow-xl shadow-indigo-500/25 flex items-center gap-2"
                        >
                            Browse Shops <ArrowRight className="h-5 w-5" />
                        </Link>
                        {!isAuthenticated && (
                            <Link
                                to="/register"
                                className="bg-white/10 backdrop-blur text-white px-8 py-3.5 rounded-xl text-lg font-medium hover:bg-white/20 transition-all border border-white/20"
                            >
                                Get Started
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Features */}
            <div className="max-w-7xl mx-auto px-4 py-16">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
                    <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 text-center">
                        <div className="bg-indigo-500/20 w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4">
                            <Store className="h-7 w-7 text-indigo-400" />
                        </div>
                        <h3 className="text-white font-semibold text-lg mb-2">Multiple Shops</h3>
                        <p className="text-gray-400 text-sm">Browse products from multiple local shops — all in one place</p>
                    </div>
                    <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 text-center">
                        <div className="bg-purple-500/20 w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4">
                            <ShoppingBag className="h-7 w-7 text-purple-400" />
                        </div>
                        <h3 className="text-white font-semibold text-lg mb-2">Easy Ordering</h3>
                        <p className="text-gray-400 text-sm">Add to cart from any shop and checkout seamlessly</p>
                    </div>
                    <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 text-center">
                        <div className="bg-pink-500/20 w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4">
                            <TrendingUp className="h-7 w-7 text-pink-400" />
                        </div>
                        <h3 className="text-white font-semibold text-lg mb-2">Track Orders</h3>
                        <p className="text-gray-400 text-sm">Real-time order tracking from placement to delivery</p>
                    </div>
                </div>

                {/* Featured Shops */}
                {shops.length > 0 && (
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-white mb-2">Featured Shops</h2>
                        <p className="text-gray-400">Popular stores on HOODAL</p>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {shops.map((shop, idx) => (
                        <Link
                            key={shop.id}
                            to={`/shop/${shop.id}`}
                            className="group bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-indigo-500/40 transition-all hover:-translate-y-1"
                        >
                            <div className={`h-24 bg-gradient-to-r ${colors[idx % colors.length]}`}></div>
                            <div className="p-5">
                                <h3 className="text-white font-bold text-lg group-hover:text-indigo-400 transition-colors">{shop.name}</h3>
                                <p className="text-gray-500 text-sm mt-1 line-clamp-2">{shop.description}</p>
                                <span className="mt-3 text-indigo-400 text-sm flex items-center gap-1">
                                    Visit Shop <ArrowRight className="h-4 w-4" />
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
