import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Store, MapPin, Phone, ArrowRight, Search, Package } from 'lucide-react';
import apiClient from '../lib/api';
import { Shop } from '../types';

export default function MarketplacePage() {
    const [shops, setShops] = useState<Shop[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchShops();
    }, []);

    const fetchShops = async () => {
        try {
            const res = await apiClient.get('/shops');
            setShops(res.data.data || []);
        } catch (err) {
            console.error('Failed to fetch shops', err);
        } finally {
            setLoading(false);
        }
    };

    const filtered = shops.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.description || '').toLowerCase().includes(search.toLowerCase())
    );

    const colors = [
        'from-indigo-500 to-purple-600',
        'from-emerald-500 to-teal-600',
        'from-orange-500 to-rose-600',
        'from-cyan-500 to-blue-600',
        'from-pink-500 to-fuchsia-600',
        'from-amber-500 to-orange-600',
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            {/* Hero */}
            <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-purple-600/20"></div>
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>

                <div className="relative max-w-7xl mx-auto px-4 py-16 sm:py-24 text-center">
                    <h1 className="text-5xl sm:text-6xl font-bold mb-4">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                            HOODAL
                        </span>
                        <span className="text-white"> Marketplace</span>
                    </h1>
                    <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
                        Discover local shops near you. Browse their catalogues and order your favourite products — all in one place.
                    </p>

                    <div className="max-w-xl mx-auto relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search shops..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg"
                        />
                    </div>
                </div>
            </div>

            {/* Shop Grid */}
            <div className="max-w-7xl mx-auto px-4 pb-16">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20">
                        <Store className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400 text-lg">No shops found</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filtered.map((shop, idx) => (
                            <Link
                                key={shop.id}
                                to={`/shop/${shop.id}`}
                                className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden hover:border-indigo-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1"
                            >
                                {/* Header Band */}
                                <div className={`h-32 bg-gradient-to-r ${colors[idx % colors.length]} relative ${!shop.isActive ? 'grayscale' : ''}`}>
                                    <div className="absolute inset-0 bg-black/20"></div>
                                    <div className="absolute bottom-4 left-4">
                                        <div className="bg-white/20 backdrop-blur-xl p-3 rounded-xl">
                                            <Store className="h-8 w-8 text-white" />
                                        </div>
                                    </div>
                                    {!shop.isActive && (
                                        <div className="absolute top-4 right-4 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg animate-pulse">
                                            OFFLINE
                                        </div>
                                    )}
                                </div>

                                <div className={`p-6 ${!shop.isActive ? 'opacity-60' : ''}`}>
                                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors">
                                        {shop.name}
                                    </h3>
                                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                                        {shop.description || 'Explore our collection of products'}
                                    </p>

                                    <div className="space-y-2 text-sm text-gray-500">
                                        {shop.address && (
                                            <div className="flex items-center gap-2">
                                                <MapPin className="h-4 w-4 text-indigo-400" />
                                                <span className="truncate">{shop.address}</span>
                                            </div>
                                        )}
                                        {shop.phone && (
                                            <div className="flex items-center gap-2">
                                                <Phone className="h-4 w-4 text-indigo-400" />
                                                <span>{shop.phone}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                                        <div className="flex items-center gap-1 text-gray-400 text-sm">
                                            <Package className="h-4 w-4" />
                                            <span>{shop._count?.products || 0} products</span>
                                        </div>
                                        <span className="text-indigo-400 flex items-center gap-1 text-sm font-medium group-hover:gap-2 transition-all">
                                            Browse <ArrowRight className="h-4 w-4" />
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
