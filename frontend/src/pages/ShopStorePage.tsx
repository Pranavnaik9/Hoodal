import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Store, ShoppingCart, MapPin, Phone, ArrowLeft, Filter, Heart, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { Shop, Product, Category } from '../types';

export default function ShopStorePage() {
    const { shopId } = useParams<{ shopId: string }>();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuthStore();
    const [shop, setShop] = useState<Shop | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [addingToCart, setAddingToCart] = useState<string>('');
    const [isFavorite, setIsFavorite] = useState(false);
    const [togglingFav, setTogglingFav] = useState(false);

    useEffect(() => {
        if (shopId) {
            fetchShopData();
        }
    }, [shopId]);

    const fetchShopData = async () => {
        try {
            const [shopRes, productsRes, categoriesRes] = await Promise.all([
                apiClient.get(`/shops/${shopId}`),
                apiClient.get(`/products?shopId=${shopId}&isActive=true`),
                apiClient.get(`/categories?shopId=${shopId}`),
            ]);
            setShop(shopRes.data.data);
            setProducts(productsRes.data);
            setCategories(categoriesRes.data);

            if (isAuthenticated) {
                const favsRes = await apiClient.get('/favorites');
                const isFav = favsRes.data.data.some((f: any) => f.shopId === shopId);
                setIsFavorite(isFav);
            }
        } catch (err) {
            console.error('Failed to fetch shop data', err);
            toast.error('Shop not found');
            navigate('/marketplace');
        } finally {
            setLoading(false);
        }
    };

    const toggleFavorite = async () => {
        if (!isAuthenticated) return toast.error('Please login to favorite shops');
        setTogglingFav(true);
        try {
            if (isFavorite) {
                await apiClient.delete(`/favorites/${shopId}`);
                setIsFavorite(false);
                toast.success('Removed from favorites');
            } else {
                await apiClient.post('/favorites', { shopId });
                setIsFavorite(true);
                toast.success('Added to favorites!');
            }
        } catch (err) {
            toast.error('Failed to update favorites');
        } finally {
            setTogglingFav(false);
        }
    };

    const addToCart = async (product: Product) => {
        if (!shop?.isActive) {
            toast.error('This shop is currently offline');
            return;
        }
        if (!isAuthenticated) {
            toast.error('Please login to add items to cart');
            navigate('/login');
            return;
        }
        setAddingToCart(product.id);
        try {
            await apiClient.post('/cart/items', {
                productId: product.id,
                quantity: 1,
                shopId: shopId,
            });
            toast.success(`${product.name} added to cart!`);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to add to cart');
        } finally {
            setAddingToCart('');
        }
    };

    const filtered = products.filter(p => {
        const matchesCategory = !selectedCategory || p.categoryId === selectedCategory;
        const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex justify-center items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            {/* Shop Header */}
            <div className="bg-gradient-to-r from-indigo-600/30 to-purple-600/30 border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <button
                        onClick={() => navigate('/marketplace')}
                        className="text-gray-400 hover:text-white flex items-center gap-1 mb-4 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" /> Back to Marketplace
                    </button>

                    {!shop?.isActive && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3">
                            <div className="bg-red-500 p-2 rounded-xl">
                                <Clock className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h3 className="text-red-400 font-bold text-sm uppercase tracking-wider">Shop is Currently Offline</h3>
                                <p className="text-gray-400 text-xs">You can browse the catalogue, but ordering is temporarily disabled by the shop owner.</p>
                            </div>
                        </div>
                    )}

                    <div className="flex items-start gap-4">
                        <div className="bg-indigo-500/20 p-4 rounded-2xl">
                            <Store className="h-10 w-10 text-indigo-400" />
                        </div>
                        <div>
                            <div className="flex items-center gap-4">
                                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-0">{shop?.name}</h1>
                                {isAuthenticated && (
                                    <button 
                                        onClick={toggleFavorite}
                                        disabled={togglingFav}
                                        className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors border border-white/10 disabled:opacity-50 mt-1"
                                    >
                                        <Heart className={`h-5 w-5 ${isFavorite ? 'fill-rose-500 text-rose-500' : 'text-gray-400'}`} />
                                    </button>
                                )}
                            </div>
                            <p className="text-gray-400 mt-1">{shop?.description}</p>
                            <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-2 text-sm text-gray-500">
                                {shop?.address && (
                                    <span className="flex items-center gap-1">
                                        <MapPin className="h-4 w-4" /> {shop.address}
                                    </span>
                                )}
                                {shop?.phone && (
                                    <span className="flex items-center gap-1">
                                        <Phone className="h-4 w-4" /> {shop.phone}
                                    </span>
                                )}
                                {shop?.deliverySlots && (
                                    <span className="flex items-center gap-1 px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded border border-indigo-500/30">
                                        <Clock className="h-3.5 w-3.5" /> Slots: {shop.deliverySlots}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar - Categories */}
                    <div className="lg:w-64 flex-shrink-0">
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sticky top-4">
                            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                                <Filter className="h-4 w-4 text-indigo-400" /> Categories
                            </h3>
                            <div className="space-y-1">
                                <button
                                    onClick={() => setSelectedCategory('')}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${!selectedCategory
                                        ? 'bg-indigo-500/20 text-indigo-400'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    All Products ({products.length})
                                </button>
                                {categories.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setSelectedCategory(cat.id)}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedCategory === cat.id
                                            ? 'bg-indigo-500/20 text-indigo-400'
                                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                                            }`}
                                    >
                                        {cat.name} ({cat._count?.Product || 0})
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Products */}
                    <div className="flex-1">
                        <div className="mb-6">
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        {filtered.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-gray-400">No products found</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filtered.map(product => (
                                    <div
                                        key={product.id}
                                        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden hover:border-indigo-500/30 transition-all group"
                                    >
                                        <div className="h-40 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 flex items-center justify-center">
                                            {product.imageUrl ? (
                                                <img
                                                    src={product.imageUrl}
                                                    alt={product.name}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <Store className="h-12 w-12 text-gray-600" />
                                            )}
                                        </div>

                                        <div className="p-4">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <h3 className="text-white font-medium text-sm">{product.name}</h3>
                                                    {product.category && (
                                                        <span className="text-xs text-gray-500">{product.category.name}</span>
                                                    )}
                                                </div>
                                                <span className="text-indigo-400 font-bold whitespace-nowrap">
                                                    ₹{product.price}
                                                </span>
                                            </div>

                                            <div className="mt-3 flex items-center justify-between">
                                                <span className={`text-xs ${product.stockQuantity > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                    {product.stockQuantity > 0 ? `${product.stockQuantity} in stock` : 'Out of stock'}
                                                </span>
                                                <button
                                                    onClick={() => addToCart(product)}
                                                    disabled={!shop?.isActive || product.stockQuantity === 0 || addingToCart === product.id}
                                                    className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                                                >
                                                    {addingToCart === product.id ? (
                                                        <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                                                    ) : (
                                                        <>
                                                            <ShoppingCart className="h-3 w-3" /> {!shop?.isActive ? 'Offline' : 'Add'}
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
