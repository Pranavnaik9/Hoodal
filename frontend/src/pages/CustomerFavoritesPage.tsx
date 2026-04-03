import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Store, MapPin, ArrowRight, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../lib/api';
import { Shop } from '../types';

interface FavoriteItem {
    id: string;
    shopId: string;
    shop: Shop;
}

export function CustomerFavoritesPage() {
    const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFavorites();
    }, []);

    const fetchFavorites = async () => {
        try {
            const res = await apiClient.get('/favorites');
            setFavorites(res.data.data || []);
        } catch (err) {
            toast.error('Failed to load favorite shops');
        } finally {
            setLoading(false);
        }
    };

    const removeFavorite = async (shopId: string) => {
        if (!confirm('Remove this shop from your favorites?')) return;
        try {
            await apiClient.delete(`/favorites/${shopId}`);
            toast.success('Shop removed from favorites');
            setFavorites(favorites.filter(f => f.shopId !== shopId));
        } catch (err) {
            toast.error('Failed to remove shop');
        }
    };

    if (loading) {
        return <div className="text-gray-400">Loading your favorite shops...</div>;
    }

    if (favorites.length === 0) {
        return (
            <div className="text-center py-16">
                <Heart className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No Favorites Yet</h3>
                <p className="text-gray-400 mb-6">You haven't added any favorite shops.</p>
                <Link to="/marketplace" className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-medium transition-colors">
                    Explore Shops
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Favorite Shops</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favorites.map(fav => (
                    <div key={fav.id} className="bg-slate-900 border border-white/10 rounded-2xl overflow-hidden group">
                        <div className="bg-gradient-to-br from-rose-500/20 to-pink-500/20 p-6 flex justify-center items-center relative h-32">
                           <button 
                               onClick={() => removeFavorite(fav.shopId)}
                               className="absolute top-3 flex items-center justify-center right-3 p-2 bg-black/30 hover:bg-red-500/80 rounded-full text-white transition-colors"
                           >
                               <Trash2 className="h-4 w-4" />
                           </button>
                           {fav.shop.imageUrl ? (
                               <img src={fav.shop.imageUrl} alt={fav.shop.name} className="h-full w-full object-cover absolute inset-0 opacity-40 mix-blend-overlay" />
                           ) : (
                               <Store className="h-12 w-12 text-rose-400" />
                           )}
                        </div>
                        <div className="p-5">
                            <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">
                                {fav.shop.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-2 text-sm text-gray-400">
                                <MapPin className="h-4 w-4 text-indigo-400" />
                                <span className="truncate">{fav.shop.address || 'Address not listed'}</span>
                            </div>
                            
                            <Link 
                                to={`/shop/${fav.shopId}`}
                                className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-indigo-400 font-medium text-sm group-hover:text-indigo-300"
                            >
                                Visit Store <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
