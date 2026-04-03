import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import './index.css';
import 'leaflet/dist/leaflet.css';
import { I18nProvider } from './lib/i18n';

import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminLayout } from './components/AdminLayout';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import MarketplacePage from './pages/MarketplacePage';
import ShopStorePage from './pages/ShopStorePage';
import HoodalAdminPage from './pages/HoodalAdminPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminProductsPage from './pages/AdminProductsPage';
import { AdminProductFormPage } from './pages/AdminProductFormPage';
import { AdminOrdersPage } from './pages/AdminOrdersPage';
import { AdminSuppliersPage } from './pages/AdminSuppliersPage';
import { AdminPurchasesPage } from './pages/AdminPurchasesPage';
import { AdminExpensesPage } from './pages/AdminExpensesPage';
import { AdminPOSPage } from './pages/AdminPOSPage';
import { AdminPOSSalesPage } from './pages/AdminPOSSalesPage';
import { AdminGSTPage } from './pages/AdminGSTPage';
import { AdminBulkRateUpdatePage } from './pages/AdminBulkRateUpdatePage';
import { AdminProfilePage } from './pages/AdminProfilePage';
import { AdminSettingsPage } from './pages/AdminSettingsPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrdersPage } from './pages/OrdersPage';
import { OrderDetailPage } from './pages/OrderDetailPage';
import { OrderConfirmationPage } from './pages/OrderConfirmationPage';
import { CustomerLayout } from './components/CustomerLayout';
import { CustomerProfilePage } from './pages/CustomerProfilePage';
import { CustomerAddressesPage } from './pages/CustomerAddressesPage';
import { CustomerPaymentsPage } from './pages/CustomerPaymentsPage';
import { CustomerFavoritesPage } from './pages/CustomerFavoritesPage';
import { CustomerExplorePage } from './pages/CustomerExplorePage';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
});

function App() {
    return (
        <div className="min-h-screen bg-slate-900">
            <Navbar />
            <Routes>
                {/* Public */}
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/marketplace" element={<MarketplacePage />} />
                <Route path="/explore" element={<CustomerExplorePage />} />
                <Route path="/shop/:shopId" element={<ShopStorePage />} />

                {/* HOODAL Admin */}
                <Route path="/hoodal-admin" element={
                    <ProtectedRoute requiredRole="HOODAL_ADMIN">
                        <HoodalAdminPage />
                    </ProtectedRoute>
                } />

                {/* Shop Admin (nested with sidebar layout) */}
                <Route path="/admin" element={
                    <ProtectedRoute requiredRole="SHOP_ADMIN">
                        <AdminLayout />
                    </ProtectedRoute>
                }>
                    <Route index element={<AdminDashboardPage />} />
                    <Route path="pos" element={<AdminPOSPage />} />
                    <Route path="pos-sales" element={<AdminPOSSalesPage />} />
                    <Route path="products" element={<AdminProductsPage />} />
                    <Route path="products/new" element={<AdminProductFormPage />} />
                    <Route path="products/:id/edit" element={<AdminProductFormPage />} />
                    <Route path="orders" element={<AdminOrdersPage />} />
                    <Route path="suppliers" element={<AdminSuppliersPage />} />
                    <Route path="purchases" element={<AdminPurchasesPage />} />
                    <Route path="expenses" element={<AdminExpensesPage />} />
                    <Route path="gst" element={<AdminGSTPage />} />
                    <Route path="rate-update" element={<AdminBulkRateUpdatePage />} />
                    <Route path="profile" element={<AdminProfilePage />} />
                    <Route path="settings" element={<AdminSettingsPage />} />
                </Route>

                {/* Customer */}
                <Route path="/cart" element={
                    <ProtectedRoute requiredRole="CUSTOMER">
                        <CartPage />
                    </ProtectedRoute>
                } />
                <Route path="/checkout/:shopId" element={
                    <ProtectedRoute requiredRole="CUSTOMER">
                        <CheckoutPage />
                    </ProtectedRoute>
                } />
                <Route path="/profile" element={
                    <ProtectedRoute requiredRole="CUSTOMER">
                        <CustomerLayout />
                    </ProtectedRoute>
                }>
                    <Route index element={<CustomerProfilePage />} />
                    <Route path="orders" element={<OrdersPage />} />
                    <Route path="addresses" element={<CustomerAddressesPage />} />
                    <Route path="payments" element={<CustomerPaymentsPage />} />
                    <Route path="favorites" element={<CustomerFavoritesPage />} />
                </Route>
                <Route path="/orders/:id" element={
                    <ProtectedRoute requiredRole="CUSTOMER">
                        <OrderDetailPage />
                    </ProtectedRoute>
                } />
                <Route path="/order-confirmation/:id" element={
                    <ProtectedRoute requiredRole="CUSTOMER">
                        <OrderConfirmationPage />
                    </ProtectedRoute>
                } />
            </Routes>
            <Toaster
                position="top-right"
                toastOptions={{
                    style: {
                        background: '#1e293b',
                        color: '#e2e8f0',
                        border: '1px solid rgba(255,255,255,0.1)',
                    },
                }}
            />
        </div>
    );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <I18nProvider>
                <BrowserRouter>
                    <App />
                </BrowserRouter>
            </I18nProvider>
        </QueryClientProvider>
    </React.StrictMode>
);
