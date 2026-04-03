import { Link, useLocation } from 'react-router-dom';
import { Package, ClipboardList, LayoutDashboard } from 'lucide-react';

export function AdminSidebar() {
    const location = useLocation();

    const isActive = (path: string) => location.pathname.startsWith(path);

    const menuItems = [
        { path: '/admin/products', label: 'Products', icon: Package, description: 'Manage inventory' },
        { path: '/admin/orders', label: 'Orders', icon: ClipboardList, description: 'View & manage orders' },
    ];

    return (
        <div className="w-64 bg-white shadow-lg min-h-screen border-r border-gray-200">
            <div className="p-4 border-b border-gray-200">
                <div className="flex items-center space-x-2">
                    <LayoutDashboard className="h-6 w-6 text-orange-500" />
                    <span className="text-lg font-bold text-gray-800">Shop Admin</span>
                </div>
            </div>

            <nav className="p-4 space-y-2">
                {menuItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive(item.path)
                                ? 'bg-orange-50 text-orange-600 border-l-4 border-orange-500'
                                : 'text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        <item.icon className="h-5 w-5" />
                        <div>
                            <p className="font-medium">{item.label}</p>
                            <p className="text-xs text-gray-500">{item.description}</p>
                        </div>
                    </Link>
                ))}
            </nav>

            <div className="absolute bottom-0 left-0 w-64 p-4 border-t border-gray-200 bg-orange-50">
                <p className="text-xs text-orange-700 font-medium">Naik Milk Center</p>
                <p className="text-xs text-gray-500">Shop Management Panel</p>
            </div>
        </div>
    );
}
