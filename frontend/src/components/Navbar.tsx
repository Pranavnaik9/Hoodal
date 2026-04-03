import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { ShoppingCart, User, LogOut, LayoutDashboard, Package, Store, Home, Map, QrCode, Heart } from 'lucide-react';
import { QRScannerModal } from './QRScannerModal';

export function Navbar() {
    const { isAuthenticated, user, logout } = useAuthStore();
    const navigate = useNavigate();
    const [isScannerOpen, setIsScannerOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 shadow-xl border-b border-indigo-500/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <Link to="/" className="flex items-center space-x-2">
                            <Store className="h-8 w-8 text-indigo-400" />
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                                HOODAL
                            </span>
                        </Link>

                        <div className="ml-10 flex items-center space-x-4">
                            {(!isAuthenticated || user?.role === 'CUSTOMER') && (
                                <>
                                    <Link
                                        to="/marketplace"
                                        className="text-gray-300 hover:text-indigo-400 font-medium transition-colors flex items-center gap-1"
                                    >
                                        <Home className="h-4 w-4" />
                                        Shops
                                    </Link>
                                    <Link
                                        to="/explore"
                                        className="text-gray-300 hover:text-indigo-400 font-medium transition-colors flex items-center gap-1"
                                    >
                                        <Map className="h-4 w-4" />
                                        Explore
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        <button 
                            onClick={() => setIsScannerOpen(true)}
                            className="flex justify-center items-center gap-2 bg-indigo-500/10 text-indigo-400 px-3 py-1.5 rounded-lg hover:bg-indigo-500/20 transition-all font-medium text-sm border border-indigo-500/20 shadow-lg shadow-indigo-500/10"
                        >
                            <QrCode className="h-4 w-4" /> Scan Shop
                        </button>
                        {isAuthenticated ? (
                            <>
                                {user?.role === 'HOODAL_ADMIN' && (
                                    <Link
                                        to="/hoodal-admin"
                                        className="flex items-center space-x-1 text-gray-300 hover:text-indigo-400 transition-colors"
                                    >
                                        <LayoutDashboard className="h-5 w-5" />
                                        <span>Admin Panel</span>
                                    </Link>
                                )}

                                {user?.role === 'SHOP_ADMIN' && (
                                    <Link
                                        to="/admin"
                                        className="flex items-center space-x-1 text-gray-300 hover:text-indigo-400 transition-colors"
                                    >
                                        <LayoutDashboard className="h-5 w-5" />
                                        <span>My Shop</span>
                                    </Link>
                                )}

                                {user?.role === 'CUSTOMER' && (
                                    <>
                                        <Link
                                            to="/profile/favorites"
                                            className="flex items-center space-x-1 text-gray-300 hover:text-indigo-400 transition-colors"
                                        >
                                            <Heart className="h-5 w-5" />
                                            <span>Favorites</span>
                                        </Link>
                                        <Link
                                            to="/cart"
                                            className="flex items-center space-x-1 text-gray-300 hover:text-indigo-400 transition-colors"
                                        >
                                            <ShoppingCart className="h-5 w-5" />
                                            <span>Cart</span>
                                        </Link>
                                        <Link
                                            to="/profile"
                                            className="flex items-center space-x-1 text-gray-300 hover:text-indigo-400 transition-colors"
                                        >
                                            <User className="h-5 w-5" />
                                            <span>Profile</span>
                                        </Link>
                                    </>
                                )}

                                <div className="flex items-center space-x-2 text-gray-400 border-l border-gray-700 pl-4">
                                    <User className="h-5 w-5" />
                                    <div className="flex flex-col">
                                        <span className="text-sm text-gray-300">
                                            {user?.firstName || user?.email}
                                        </span>
                                        <span className="text-xs text-indigo-400">
                                            {user?.role === 'HOODAL_ADMIN' ? 'Platform Admin' :
                                                user?.role === 'SHOP_ADMIN' ? (user?.shopName || 'Shop Admin') :
                                                    'Customer'}
                                        </span>
                                    </div>
                                </div>

                                <button
                                    onClick={handleLogout}
                                    className="flex items-center space-x-1 text-gray-400 hover:text-red-400 transition-colors"
                                >
                                    <LogOut className="h-5 w-5" />
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className="text-gray-300 hover:text-indigo-400 font-medium transition-colors"
                                >
                                    Login
                                </Link>
                                <Link
                                    to="/register"
                                    className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg shadow-indigo-500/25"
                                >
                                    Register
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
            <QRScannerModal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} />
        </nav>
    );
}
