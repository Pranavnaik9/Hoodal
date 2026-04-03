import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Product } from '../types';
import { useAuthStore } from '../store/authStore';

export default function ProductDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [addingToCart, setAddingToCart] = useState(false);

    useEffect(() => {
        fetchProduct();
    }, [id]);

    const fetchProduct = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/products/${id}`);
            setProduct(response.data);
        } catch (error: any) {
            toast.error('Failed to load product');
            navigate('/products');
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = async () => {
        if (!user) {
            toast.error('Please login to add items to cart');
            navigate('/login');
            return;
        }

        try {
            setAddingToCart(true);
            await api.post('/cart/items', {
                productId: product!.id,
                quantity,
            });
            toast.success('Added to cart!');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to add to cart');
        } finally {
            setAddingToCart(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-lg">Loading...</div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-lg">Product not found</div>
            </div>
        );
    }

    const canAddToCart = product.isActive && product.stockQuantity > 0;

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <button
                onClick={() => navigate('/products')}
                className="text-blue-600 hover:text-blue-800 mb-6"
            >
                ← Back to Products
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Product Image */}
                <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                    {product.imageUrl ? (
                        <img
                            src={import.meta.env.VITE_API_URL + product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <span className="text-2xl">No Image Available</span>
                        </div>
                    )}
                </div>

                {/* Product Details */}
                <div>
                    <h1 className="text-4xl font-bold mb-4">{product.name}</h1>

                    {product.category && (
                        <p className="text-gray-600 mb-4">
                            Category: <span className="font-semibold">{product.category.name}</span>
                        </p>
                    )}

                    <div className="text-4xl font-bold text-blue-600 mb-6">
                        ₹{product.price}
                    </div>

                    {product.description && (
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold mb-2">Description</h3>
                            <p className="text-gray-700 whitespace-pre-line">
                                {product.description}
                            </p>
                        </div>
                    )}

                    {/* Stock Status */}
                    <div className="mb-6">
                        {product.stockQuantity === 0 ? (
                            <div className="text-red-600 font-semibold text-lg">
                                Out of Stock
                            </div>
                        ) : (
                            <div className="text-green-600 font-semibold">
                                In Stock ({product.stockQuantity} available)
                            </div>
                        )}
                    </div>

                    {/* Add to Cart */}
                    {canAddToCart && (
                        <div className="flex items-center gap-4 mb-6">
                            <div className="flex items-center border rounded-lg">
                                <button
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="px-4 py-2 hover:bg-gray-100"
                                >
                                    -
                                </button>
                                <span className="px-6 py-2 border-x">{quantity}</span>
                                <button
                                    onClick={() =>
                                        setQuantity(
                                            Math.min(product.stockQuantity, quantity + 1)
                                        )
                                    }
                                    className="px-4 py-2 hover:bg-gray-100"
                                >
                                    +
                                </button>
                            </div>

                            <button
                                onClick={handleAddToCart}
                                disabled={addingToCart}
                                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-semibold text-lg"
                            >
                                {addingToCart ? 'Adding...' : 'Add to Cart'}
                            </button>
                        </div>
                    )}

                    {!product.isActive && (
                        <div className="text-red-600 font-semibold">
                            This product is currently unavailable
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
