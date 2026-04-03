export interface User {
    id?: string;
    userId?: string;
    email: string;
    role: 'CUSTOMER' | 'SHOP_ADMIN' | 'HOODAL_ADMIN';
    firstName?: string;
    lastName?: string;
    phone?: string;
    shopId?: string;
    shopName?: string;
    createdAt?: string;
}

export interface AuthResponse {
    success: boolean;
    data: {
        user: User;
        token: string;
    };
}

export interface Shop {
    id: string;
    name: string;
    description?: string;
    address?: string;
    phone?: string;
    imageUrl?: string;
    deliverySlots?: string;
    latitude?: number | null;
    longitude?: number | null;
    isActive: boolean;
    ownerId: string;
    createdAt: string;
    updatedAt: string;
    owner?: {
        id: string;
        email: string;
        firstName?: string;
        lastName?: string;
    };
    categories?: Category[];
    _count?: {
        products: number;
        orders: number;
    };
}

export interface ShopStats {
    productCount: number;
    orderCount: number;
    totalRevenue: number;
    pendingOrders: number;
}

export interface Product {
    id: string;
    name: string;
    description?: string;
    categoryId?: string;
    shopId: string;
    price: number;
    costPrice: number;
    gstRate?: number;
    imageUrl?: string;
    stockQuantity: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    category?: {
        id: string;
        name: string;
    };
    shop?: {
        id: string;
        name: string;
    };
}

export interface Category {
    id: string;
    name: string;
    description?: string;
    shopId?: string;
    createdAt: string;
    _count?: {
        Product: number;
    };
    shop?: {
        id: string;
        name: string;
    };
}

export interface Cart {
    id: string;
    userId: string;
    shopId: string;
    CartItem: CartItem[];
    shop?: {
        id: string;
        name: string;
        deliverySlots?: string;
    };
    createdAt: string;
    updatedAt: string;
}

export interface CartItem {
    id: string;
    cartId: string;
    productId: string;
    quantity: number;
    price: number;
    product: Product;
    createdAt: string;
}

export interface Order {
    id: string;
    orderNumber: string;
    userId: string;
    shopId: string;
    status: OrderStatus;
    subtotal: number;
    tax: number;
    total: number;
    deliveryName?: string;
    deliveryPhone?: string;
    deliveryAddress?: string;
    deliveryCity?: string;
    deliveryState?: string;
    deliveryPincode?: string;
    deliverySlot?: string;
    paymentMethod?: string;
    paymentStatus: PaymentStatus;
    paymentId?: string;
    createdAt: string;
    updatedAt: string;
    OrderItem?: OrderItem[];
    shop?: {
        id: string;
        name: string;
    };
    user?: {
        id: string;
        email: string;
        firstName?: string;
        lastName?: string;
    };
}

export interface OrderItem {
    id: string;
    orderId: string;
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    createdAt: string;
    product?: {
        id: string;
        name: string;
        imageUrl?: string;
    };
}

export type OrderStatus =
    | 'PENDING'
    | 'OUT_FOR_DELIVERY'
    | 'DELIVERED'
    | 'CANCELLED';

export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

export interface StockHistory {
    id: string;
    productId: string;
    changeType: string;
    quantityChange: number;
    previousQuantity: number;
    newQuantity: number;
    referenceType?: string;
    referenceId?: string;
    notes?: string;
    createdBy: string;
    createdAt: string;
    user: {
        id: string;
        email: string;
        firstName?: string;
        lastName?: string;
    };
}
