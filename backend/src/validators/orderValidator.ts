import { z } from 'zod';

// Checkout input validation
export const checkoutSchema = z.object({
    deliveryName: z.string().min(1, 'Delivery name is required'),
    deliveryPhone: z.string().min(10, 'Valid phone number is required'),
    deliveryAddress: z.string().min(5, 'Delivery address is required'),
    deliveryCity: z.string().min(1, 'City is required'),
    deliveryState: z.string().min(1, 'State is required'),
    deliveryPincode: z.string().min(4, 'Valid pincode is required'),
    deliverySlot: z.string().optional(),
    paymentMethod: z.string().default('COD'),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

// POS Checkout input validation
export const posCheckoutSchema = z.object({
    items: z.array(z.object({
        productId: z.string(),
        quantity: z.number().min(1)
    })).min(1, 'At least one item is required'),
    paymentMethod: z.string().default('CASH'),
    paymentStatus: z.string().default('PAID'),
});

export type PosCheckoutInput = z.infer<typeof posCheckoutSchema>;

// Update order status validation
export const updateOrderStatusSchema = z.object({
    status: z.enum([
        'PENDING',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
        'CANCELLED',
    ]),
});

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;

// Order filter validation (for admin)
export const orderFilterSchema = z.object({
    status: z
        .enum([
            'PENDING',
            'OUT_FOR_DELIVERY',
            'DELIVERED',
            'CANCELLED',
        ])
        .optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
});

export type OrderFilterInput = z.infer<typeof orderFilterSchema>;
