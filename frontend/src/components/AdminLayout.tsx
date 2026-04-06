import { Outlet, NavLink } from 'react-router-dom';
import { Package, ShoppingBag, LayoutDashboard, Store, Users, FileText, Receipt, Monitor, Calculator, DollarSign, UserCircle, Settings } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useI18n } from '../lib/i18n';

export function AdminLayout() {
    const { user } = useAuthStore();
    const { t } = useI18n();

    const links = [
        { to: '/admin', icon: LayoutDashboard, label: t('nav.dashboard'), end: true },
        { to: '/admin/pos', icon: Monitor, label: t('nav.pos'), end: false },
        { to: '/admin/pos-sales', icon: Receipt, label: t('nav.posSales'), end: false },
        { to: '/admin/products', icon: Package, label: t('nav.products'), end: false },
        { to: '/admin/orders', icon: ShoppingBag, label: t('nav.orders'), end: false },
        { to: '/admin/suppliers', icon: Users, label: t('nav.suppliers'), end: false },
        { to: '/admin/purchases', icon: FileText, label: t('nav.purchases'), end: false },
        { to: '/admin/expenses', icon: Store, label: t('nav.expenses'), end: false },
        { to: '/admin/gst', icon: Calculator, label: t('nav.gst'), end: false },
        { to: '/admin/rate-update', icon: DollarSign, label: t('nav.rateUpdate'), end: false },
    ];

    const bottomLinks = [
        { to: '/admin/profile', icon: UserCircle, label: t('nav.profile'), end: false },
        { to: '/admin/settings', icon: Settings, label: t('nav.settings'), end: false },
    ];

    const linkCls = (isActive: boolean) =>
        `flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm transition-colors ${isActive
            ? 'bg-indigo-500/20 text-indigo-400'
            : 'text-gray-400 hover:text-white hover:bg-white/5'
        }`;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <div className="max-w-7xl mx-auto px-4 py-6">
                {/* Shop name header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-indigo-500/20 p-2.5 rounded-xl">
                        <Store className="h-6 w-6 text-indigo-400" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white">{user?.shopName || 'Shop Admin'}</h1>
                        <p className="text-gray-500 text-xs">Manage your shop</p>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Sidebar */}
                    <nav className="lg:w-56 flex-shrink-0">
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-3 lg:sticky lg:top-4">
                            <div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 -mx-1 px-1 lg:mx-0 lg:px-0 scrollbar-hide">
                            {links.map(l => (
                                <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => linkCls(isActive)}>
                                    <l.icon className="h-4 w-4" /> {l.label}
                                </NavLink>
                            ))
                            }
                            </div>

                            {/* Separator */}
                            <div className="border-t border-white/5 my-2"></div>

                            <div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible -mx-1 px-1 lg:mx-0 lg:px-0 scrollbar-hide">

                            {bottomLinks.map(l => (
                                <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => linkCls(isActive)}>
                                    <l.icon className="h-4 w-4" /> {l.label}
                                </NavLink>
                            ))}
                            </div>
                        </div>
                    </nav>

                    {/* Content */}
                    <div className="flex-1">
                        <Outlet />
                    </div>
                </div>
            </div>
        </div>
    );
}

