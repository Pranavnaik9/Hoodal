import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Store, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../lib/api';
import { useAuthStore } from '../store/authStore';

const registerSchema = z.object({
    email: z.string().email('Valid email required'),
    password: z.string().min(6, 'Min 6 characters'),
    confirmPassword: z.string(),
    firstName: z.string().min(1, 'First name required'),
    lastName: z.string().min(1, 'Last name required'),
    phone: z.string().optional(),
}).refine(d => d.password === d.confirmPassword, {
    message: 'Passwords must match',
    path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

export function RegisterPage() {
    const navigate = useNavigate();
    const { login } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const { register: reg, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = async (data: RegisterForm) => {
        setLoading(true);
        try {
            const res = await apiClient.post('/auth/register', {
                email: data.email,
                password: data.password,
                firstName: data.firstName,
                lastName: data.lastName,
                phone: data.phone,
            });
            const { user, token } = res.data.data;
            login(user, token);
            toast.success('Account created successfully!');
            navigate('/marketplace');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Registration failed');
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
                    <div className="text-center mb-6">
                        <Link to="/" className="inline-flex items-center gap-2 mb-4">
                            <Store className="h-10 w-10 text-indigo-400" />
                            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                                HOODAL
                            </span>
                        </Link>
                        <h2 className="text-xl text-white font-semibold">Create an account</h2>
                        <p className="text-gray-400 text-sm mt-1">Join HOODAL marketplace today</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-gray-400 text-sm">First Name</label>
                                <input
                                    {...reg('firstName')}
                                    className="w-full mt-1 px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="John"
                                />
                                {errors.firstName && <p className="text-red-400 text-xs mt-1">{errors.firstName.message}</p>}
                            </div>
                            <div>
                                <label className="text-gray-400 text-sm">Last Name</label>
                                <input
                                    {...reg('lastName')}
                                    className="w-full mt-1 px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Doe"
                                />
                                {errors.lastName && <p className="text-red-400 text-xs mt-1">{errors.lastName.message}</p>}
                            </div>
                        </div>

                        <div>
                            <label className="text-gray-400 text-sm">Email</label>
                            <input
                                {...reg('email')}
                                type="email"
                                className="w-full mt-1 px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="you@example.com"
                            />
                            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
                        </div>

                        <div>
                            <label className="text-gray-400 text-sm">Phone (optional)</label>
                            <input
                                {...reg('phone')}
                                className="w-full mt-1 px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="9876543210"
                            />
                        </div>

                        <div>
                            <label className="text-gray-400 text-sm">Password</label>
                            <div className="relative">
                                <input
                                    {...reg('password')}
                                    type={showPassword ? 'text' : 'password'}
                                    className="w-full mt-1 px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-10"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 mt-0.5 text-gray-400"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
                        </div>

                        <div>
                            <label className="text-gray-400 text-sm">Confirm Password</label>
                            <input
                                {...reg('confirmPassword')}
                                type="password"
                                className="w-full mt-1 px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="••••••••"
                            />
                            {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword.message}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl text-lg font-medium hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50 mt-2"
                        >
                            {loading ? 'Creating account...' : 'Create Account'}
                        </button>
                    </form>

                    <p className="text-center text-gray-400 text-sm mt-5">
                        Already have an account?{' '}
                        <Link to="/login" className="text-indigo-400 hover:text-indigo-300">Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
