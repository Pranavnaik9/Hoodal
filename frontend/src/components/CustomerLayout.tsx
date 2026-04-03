import { Outlet, NavLink } from 'react-router-dom';
import { UserCircle, MapPin, CreditCard, Heart, Package, LogOut } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';

export function CustomerLayout() {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const links = [
        { to: '/profile', icon: UserCircle, label: 'Profile Overview', end: true },
        { to: '/profile/orders', icon: Package, label: 'My Orders', end: false },
        { to: '/profile/favorites', icon: Heart, label: 'Favorite Shops', end: false },
        { to: '/profile/addresses', icon: MapPin, label: 'Saved Addresses', end: false },
        { to: '/profile/payments', icon: CreditCard, label: 'Payment Methods', end: false },
    ];

    const linkCls = (isActive: boolean) =>
        `flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors ${isActive
            ? 'bg-indigo-500/20 text-indigo-400 font-medium border border-indigo-500/20'
            : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
        }`;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white">My Account</h1>
                    <p className="text-gray-400 mt-1">Manage your orders, addresses, and account details</p>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar */}
                    <nav className="lg:w-64 flex-shrink-0">
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sticky top-4 space-y-1">
                            <div className="mb-6 px-4 py-2">
                                <p className="text-sm text-gray-400">Welcome back,</p>
                                <p className="text-lg font-bold text-white truncate">{user?.firstName || user?.email}</p>
                            </div>

                            {links.map(l => (
                                <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => linkCls(isActive)}>
                                    <l.icon className="h-5 w-5" /> {l.label}
                                </NavLink>
                            ))}

                            <div className="border-t border-white/10 my-4"></div>

                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                            >
                                <LogOut className="h-5 w-5" /> Logout
                            </button>
                        </div>
                    </nav>

                    {/* Main Content Area */}
                    <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 min-h-[500px]">
                        <Outlet />
                    </div>
                </div>
            </div>
        </div>
    );
}
