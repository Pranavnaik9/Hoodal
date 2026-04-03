import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Store, CreditCard, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../lib/api';
import { Cart } from '../types';

const checkoutSchema = z.object({
    deliveryName: z.string().min(1, 'Name required'),
    deliveryPhone: z.string().min(10, 'Valid phone required'),
    deliveryAddress: z.string().min(1, 'Address required'),
    deliveryCity: z.string().min(1, 'City required'),
    deliveryState: z.string().min(1, 'State required'),
    deliveryPincode: z.string().min(6, 'Valid pincode required'),
    deliverySlot: z.string().optional(),
    paymentMethod: z.string().min(1, 'Select payment method'),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

export function CheckoutPage() {
    const { shopId } = useParams<{ shopId: string }>();
    const navigate = useNavigate();
    const [cart, setCart] = useState<Cart | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<CheckoutForm>({
        resolver: zodResolver(checkoutSchema),
        defaultValues: { paymentMethod: 'COD' },
    });

    useEffect(() => {
        if (shopId) fetchCart();
    }, [shopId]);

    const fetchCart = async () => {
        try {
            const res = await apiClient.get(`/cart?shopId=${shopId}`);
            setCart(res.data);
        } catch { toast.error('Failed to load cart'); }
        finally { setLoading(false); }
    };

    const total = cart?.CartItem?.reduce((s, i) => s + Number(i.price) * i.quantity, 0) || 0;

    const onSubmit = async (data: CheckoutForm) => {
        setSubmitting(true);
        try {
            const res = await apiClient.post('/orders', { ...data, shopId });
            toast.success('Order placed successfully!');
            navigate(`/order-confirmation/${res.data.data.id}`);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Checkout failed');
        } finally { setSubmitting(false); }
    };

    if (loading) {
        return <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
        </div>;
    }

    const inputCls = "w-full mt-1 px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500";

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-white mb-6">Checkout</h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Form */}
                    <div className="lg:col-span-2">
                        <form onSubmit={handleSubmit(onSubmit)} id="checkout-form" className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                            <h2 className="text-white font-semibold flex items-center gap-2"><MapPin className="h-5 w-5 text-indigo-400" /> Delivery Details</h2>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-gray-400 text-sm">Full Name</label>
                                    <input {...register('deliveryName')} className={inputCls} placeholder="Full Name" />
                                    {errors.deliveryName && <p className="text-red-400 text-xs mt-1">{errors.deliveryName.message}</p>}
                                </div>
                                <div>
                                    <label className="text-gray-400 text-sm">Phone</label>
                                    <input {...register('deliveryPhone')} className={inputCls} placeholder="Phone" />
                                    {errors.deliveryPhone && <p className="text-red-400 text-xs mt-1">{errors.deliveryPhone.message}</p>}
                                </div>
                            </div>

                            <div>
                                <label className="text-gray-400 text-sm">Address</label>
                                <input {...register('deliveryAddress')} className={inputCls} placeholder="Street address" />
                                {errors.deliveryAddress && <p className="text-red-400 text-xs mt-1">{errors.deliveryAddress.message}</p>}
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="text-gray-400 text-sm">City</label>
                                    <input {...register('deliveryCity')} className={inputCls} placeholder="City" />
                                    {errors.deliveryCity && <p className="text-red-400 text-xs mt-1">{errors.deliveryCity.message}</p>}
                                </div>
                                <div>
                                    <label className="text-gray-400 text-sm">State</label>
                                    <input {...register('deliveryState')} className={inputCls} placeholder="State" />
                                    {errors.deliveryState && <p className="text-red-400 text-xs mt-1">{errors.deliveryState.message}</p>}
                                </div>
                                <div>
                                    <label className="text-gray-400 text-sm">Pincode</label>
                                    <input {...register('deliveryPincode')} className={inputCls} placeholder="Pincode" />
                                    {errors.deliveryPincode && <p className="text-red-400 text-xs mt-1">{errors.deliveryPincode.message}</p>}
                                </div>
                            </div>

                            <div>
                                <h2 className="text-white font-semibold flex items-center gap-2 mt-4"><CreditCard className="h-5 w-5 text-indigo-400" /> Payment</h2>
                                <div className="mt-2 flex gap-3">
                                    {['COD', 'UPI'].map(m => (
                                        <label key={m} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3 cursor-pointer hover:border-indigo-500/30">
                                            <input {...register('paymentMethod')} type="radio" value={m} className="accent-indigo-500" />
                                            <span className="text-white text-sm">{m === 'COD' ? 'Cash on Delivery' : 'UPI'}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {cart?.shop?.deliverySlots && (
                                <div>
                                    <h2 className="text-white font-semibold flex items-center gap-2 mt-4 text-sm uppercase tracking-wider text-gray-400">Delivery Slot preference</h2>
                                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {cart.shop.deliverySlots.split(',').map((slot: string) => {
                                            const cleanSlot = slot.trim();
                                            if (!cleanSlot) return null;
                                            return (
                                                <label key={cleanSlot} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3 cursor-pointer hover:border-indigo-500/30">
                                                    <input {...register('deliverySlot')} type="radio" value={cleanSlot} className="accent-indigo-500" />
                                                    <span className="text-white text-sm">{cleanSlot}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">Optional: Select your preferred delivery time.</p>
                                </div>
                            )}
                        </form>
                    </div>

                    {/* Order Summary */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 h-fit sticky top-6">
                        <h2 className="text-white font-semibold mb-4">Order Summary</h2>
                        {cart?.shop && (
                            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-white/10">
                                <Store className="h-4 w-4 text-indigo-400" />
                                <span className="text-gray-400 text-sm">{cart.shop.name}</span>
                            </div>
                        )}

                        <div className="space-y-2 mb-4">
                            {cart?.CartItem?.map(item => (
                                <div key={item.id} className="flex justify-between text-sm">
                                    <span className="text-gray-400">{item.product.name} × {item.quantity}</span>
                                    <span className="text-white">₹{(Number(item.price) * item.quantity).toFixed(0)}</span>
                                </div>
                            ))}
                        </div>

                        <div className="border-t border-white/10 pt-3 mb-4">
                            <div className="flex justify-between text-lg">
                                <span className="text-white font-semibold">Total</span>
                                <span className="text-indigo-400 font-bold">₹{total.toFixed(0)}</span>
                            </div>
                        </div>

                        <button
                            type="submit"
                            form="checkout-form"
                            disabled={submitting}
                            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-medium hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50"
                        >
                            {submitting ? 'Placing Order...' : 'Place Order'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
