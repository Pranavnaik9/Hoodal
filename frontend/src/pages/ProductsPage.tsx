import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Product, Category } from '../types';

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [productsRes, categoriesRes] = await Promise.all([
                api.get('/products', { params: { isActive: true } }),
                api.get('/categories'),
            ]);
            setProducts(productsRes.data);
            setCategories(categoriesRes.data);
        } catch (error: any) {
            toast.error('Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    const filteredProducts = products.filter((product) => {
        const matchesSearch = product.name
            .toLowerCase()
            .includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory
            ? product.categoryId === selectedCategory
            : true;
        return matchesSearch && matchesCategory && product.isActive;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-lg">Loading products...</div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <h1 className="text-4xl font-bold mb-8">Our Products</h1>

            {/* Filters */}
            <div className="mb-8 space-y-4">
                <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <div className="flex gap-2 flex-wrap">
                    <button
                        onClick={() => setSelectedCategory('')}
                        className={`px-4 py-2 rounded-lg ${selectedCategory === ''
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                    >
                        All Categories
                    </button>
                    {categories.map((category) => (
                        <button
                            key={category.id}
                            onClick={() => setSelectedCategory(category.id)}
                            className={`px-4 py-2 rounded-lg ${selectedCategory === category.id
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                        >
                            {category.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Products Grid */}
            {filteredProducts.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    No products found
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {filteredProducts.map((product) => (
                        <Link
                            key={product.id}
                            to={`/products/${product.id}`}
                            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                        >
                            <div className="aspect-square bg-gray-200">
                                {product.imageUrl ? (
                                    <img
                                        src={import.meta.env.VITE_API_URL + product.imageUrl}
                                        alt={product.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        No Image
                                    </div>
                                )}
                            </div>
                            <div className="p-4">
                                <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                                    {product.name}
                                </h3>
                                {product.category && (
                                    <p className="text-sm text-gray-600 mb-2">
                                        {product.category.name}
                                    </p>
                                )}
                                <div className="flex items-center justify-between">
                                    <span className="text-xl font-bold text-blue-600">₹{product.price}</span>
                                    {product.stockQuantity === 0 ? (
                                        <span className="text-red-600 text-sm font-semibold">
                                            Out of Stock
                                        </span>
                                    ) : (
                                        <span className="text-green-600 text-sm">
                                            In Stock
                                        </span>
                                    )}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
