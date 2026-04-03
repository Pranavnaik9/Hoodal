import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Store, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../lib/api';
import { useAuthStore } from '../store/authStore';

const loginSchema = z.object({
    email: z.string().email('Valid email required'),
    password: z.string().min(1, 'Password required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
    const navigate = useNavigate();
    const { login } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginForm) => {
        setLoading(true);
        try {
            const res = await apiClient.post('/auth/login', data);
            const { user, token } = res.data.data;
            login(user, token);
            toast.success(`Welcome back, ${user.firstName || user.email}!`);

            // Route by role
            if (user.role === 'HOODAL_ADMIN') navigate('/hoodal-admin');
            else if (user.role === 'SHOP_ADMIN') navigate('/admin');
            else navigate('/marketplace');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
            </div>

            <div className="relative w-full max-w-md">
                <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                    <div className="text-center mb-8">
                        <Link to="/" className="inline-flex items-center gap-2 mb-4">
                            <Store className="h-10 w-10 text-indigo-400" />
                            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                                HOODAL
                            </span>
                        </Link>
                        <h2 className="text-xl text-white font-semibold">Welcome back</h2>
                        <p className="text-gray-400 text-sm mt-1">Sign in to your account</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                            <label className="text-gray-400 text-sm">Email</label>
                            <input
                                {...register('email')}
                                type="email"
                                placeholder="you@example.com"
                                className="w-full mt-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
                        </div>

                        <div>
                            <label className="text-gray-400 text-sm">Password</label>
                            <div className="relative">
                                <input
                                    {...register('password')}
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    className="w-full mt-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-12"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 mt-0.5 text-gray-400 hover:text-white"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                            {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl text-lg font-medium hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50"
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    <p className="text-center text-gray-400 text-sm mt-6">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-indigo-400 hover:text-indigo-300">
                            Register
                        </Link>
                    </p>

                    <div className="mt-6 pt-6 border-t border-white/10">
                        <p className="text-gray-500 text-xs text-center mb-3">Demo Accounts</p>
                        <div className="grid grid-cols-1 gap-2 text-xs">
                            <div className="bg-white/5 rounded-lg p-2 flex justify-between text-gray-400">
                                <span>Platform Admin</span>
                                <span className="text-gray-300">admin@hoodal.com / hoodal123</span>
                            </div>
                            <div className="bg-white/5 rounded-lg p-2 flex justify-between text-gray-400">
                                <span>Shop Admin</span>
                                <span className="text-gray-300">admin@freshmart.com / shop123</span>
                            </div>
                            <div className="bg-white/5 rounded-lg p-2 flex justify-between text-gray-400">
                                <span>Customer</span>
                                <span className="text-gray-300">customer@test.com / customer123</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
