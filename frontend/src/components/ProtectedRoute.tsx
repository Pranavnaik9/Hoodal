import { useAuthStore } from '../store/authStore';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRole?: 'CUSTOMER' | 'SHOP_ADMIN' | 'HOODAL_ADMIN';
    allowedRoles?: string[];
}

export function ProtectedRoute({ children, requiredRole, allowedRoles }: ProtectedRouteProps) {
    const { isAuthenticated, user } = useAuthStore();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (requiredRole && user?.role !== requiredRole) {
        return <Navigate to="/" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user?.role || '')) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}
