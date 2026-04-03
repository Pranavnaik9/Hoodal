// Order types
export interface Order {
    id: string;
    orderNumber: string;
    userId: string;
    status: OrderStatus;
    subtotal: number;
    tax: number;
    total: number;
    deliveryName: string;
    deliveryPhone: string;
    deliveryAddress: string;
    deliveryCity: string;
    deliveryState: string;
    deliveryPincode: string;
    deliverySlot?: string;
    paymentMethod: string;
    paymentStatus: PaymentStatus;
    paymentId?: string;
    createdAt: string;
    updatedAt: string;
    OrderItem: OrderItem[];
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

export enum OrderStatus {
    PENDING = 'PENDING',
    OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
    DELIVERED = 'DELIVERED',
    CANCELLED = 'CANCELLED',
}

export enum PaymentStatus {
    PENDING = 'PENDING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
}

// Create order input
export interface CreateOrderInput {
    deliveryName: string;
    deliveryPhone: string;
    deliveryAddress: string;
    deliveryCity: string;
    deliveryState: string;
    deliveryPincode: string;
    deliverySlot?: string;
    paymentMethod: string;
}

// Update order status input
export interface UpdateOrderStatusInput {
    status: OrderStatus;
}
