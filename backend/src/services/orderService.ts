import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { CheckoutInput, UpdateOrderStatusInput, OrderFilterInput } from '../validators/orderValidator';

const prisma = new PrismaClient();

export class OrderService {
    /**
     * Create order from user's cart for a specific shop
     */
    async createOrder(userId: string, shopId: string, checkoutData: CheckoutInput) {
        return await prisma.$transaction(async (tx) => {
            const cart = await tx.cart.findFirst({
                where: { userId, shopId },
                include: {
                    CartItem: {
                        include: { product: true },
                    },
                },
            });

            if (!cart || cart.CartItem.length === 0) {
                throw new AppError('Cart is empty', 400);
            }

            for (const item of cart.CartItem) {
                if (!item.product.isActive) {
                    throw new AppError(`Product ${item.product.name} is not available`, 400);
                }
                if (item.product.stockQuantity < item.quantity) {
                    throw new AppError(
                        `Insufficient stock for ${item.product.name}. Available: ${item.product.stockQuantity}`,
                        400
                    );
                }
            }

            let subtotal = 0;
            let tax = 0;

            for (const item of cart.CartItem) {
                const itemGstRate = item.product.gstRate || 0;
                const inclusivePrice = Number(item.price) * item.quantity;
                const basePrice = itemGstRate > 0
                    ? inclusivePrice / (1 + itemGstRate / 100)
                    : inclusivePrice;
                const itemGstAmount = inclusivePrice - basePrice;

                subtotal += basePrice;
                tax += itemGstAmount;
            }

            const total = subtotal + tax;

            const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

            const order = await tx.order.create({
                data: {
                    orderNumber,
                    orderType: 'ONLINE',
                    userId,
                    shopId,
                    status: 'PENDING',
                    subtotal,
                    tax,
                    total,
                    deliveryName: checkoutData.deliveryName,
                    deliveryPhone: checkoutData.deliveryPhone,
                    deliveryAddress: checkoutData.deliveryAddress,
                    deliveryCity: checkoutData.deliveryCity,
                    deliveryState: checkoutData.deliveryState,
                    deliveryPincode: checkoutData.deliveryPincode,
                    deliverySlot: checkoutData.deliverySlot,
                    paymentMethod: checkoutData.paymentMethod,
                    paymentStatus: 'PENDING',
                    OrderItem: {
                        create: cart.CartItem.map((item) => {
                            const gstRate = item.product.gstRate || 0;
                            const inclusivePrice = Number(item.price) * item.quantity;
                            const basePrice = gstRate > 0
                                ? inclusivePrice / (1 + gstRate / 100)
                                : inclusivePrice;
                            const gstAmount = inclusivePrice - basePrice;

                            return {
                                productId: item.productId,
                                productName: item.product.name,
                                quantity: item.quantity,
                                price: item.price,
                                gstRate,
                                gstAmount: Math.round(gstAmount * 100) / 100
                            };
                        }),
                    },
                },
                include: {
                    OrderItem: {
                        include: { product: true },
                    },
                    shop: {
                        select: { id: true, name: true },
                    },
                },
            });

            // Deduct stock
            for (const item of cart.CartItem) {
                const previousQuantity = item.product.stockQuantity;
                const newQuantity = previousQuantity - item.quantity;

                await tx.product.update({
                    where: { id: item.productId },
                    data: { stockQuantity: newQuantity },
                });

                await tx.stockHistory.create({
                    data: {
                        productId: item.productId,
                        changeType: 'SALE',
                        quantityChange: -item.quantity,
                        previousQuantity,
                        newQuantity,
                        referenceType: 'ORDER',
                        referenceId: order.id,
                        notes: `Stock deducted for online order ${orderNumber}`,
                        createdBy: userId,
                    },
                });
            }

            // Clear cart
            await tx.cartItem.deleteMany({
                where: { cartId: cart.id },
            });

            return order;
        });
    }

    /**
     * Create POS order (direct sale, bypasses cart)
     */
    async createPOSOrder(shopId: string, adminId: string, data: any) {
        return await prisma.$transaction(async (tx) => {
            // Validate all products
            const orderItems = [];
            let subtotal = 0;
            let tax = 0;

            for (const item of data.items) {
                const product = await tx.product.findFirst({
                    where: { id: item.productId, shopId }
                });

                if (!product) {
                    throw new AppError(`Product not found or does not belong to your shop`, 404);
                }

                if (product.stockQuantity < item.quantity) {
                    throw new AppError(`Insufficient stock for ${product.name}. Available: ${product.stockQuantity}`, 400);
                }

                // GST INCLUSIVE: price already includes GST, back-calculate
                const itemGstRate = product.gstRate || 0;
                const inclusivePrice = product.price * item.quantity;
                const basePrice = itemGstRate > 0
                    ? inclusivePrice / (1 + itemGstRate / 100)
                    : inclusivePrice;
                const itemGstAmount = inclusivePrice - basePrice;

                subtotal += basePrice;
                tax += itemGstAmount;

                orderItems.push({
                    productId: product.id,
                    productName: product.name,
                    quantity: item.quantity,
                    price: product.price,
                    gstRate: itemGstRate,
                    gstAmount: Math.round(itemGstAmount * 100) / 100,
                    // For stock deduction later
                    product
                });
            }

            const total = subtotal + tax;
            const orderNumber = `POS-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

            const order = await tx.order.create({
                data: {
                    orderNumber,
                    orderType: 'POS',
                    userId: null, // Guest POS order
                    shopId,
                    status: 'DELIVERED', // Handed over immediately
                    subtotal,
                    tax,
                    total,
                    paymentMethod: data.paymentMethod,
                    paymentStatus: data.paymentStatus,
                    OrderItem: {
                        create: orderItems.map((item) => ({
                            productId: item.productId,
                            productName: item.productName,
                            quantity: item.quantity,
                            price: item.price,
                            gstRate: item.gstRate,
                            gstAmount: item.gstAmount
                        })),
                    },
                },
                include: {
                    OrderItem: {
                        include: { product: true },
                    },
                },
            });

            // Deduct stock
            for (const item of orderItems) {
                const previousQuantity = item.product.stockQuantity;
                const newQuantity = previousQuantity - item.quantity;

                await tx.product.update({
                    where: { id: item.productId },
                    data: { stockQuantity: newQuantity },
                });

                await tx.stockHistory.create({
                    data: {
                        productId: item.productId,
                        changeType: 'SALE',
                        quantityChange: -item.quantity,
                        previousQuantity,
                        newQuantity,
                        referenceType: 'POS_ORDER',
                        referenceId: order.id,
                        notes: `Stock deducted for POS order ${orderNumber}`,
                        createdBy: adminId,
                    },
                });
            }

            return order;
        });
    }

    async getCustomerOrders(userId: string) {
        const orders = await prisma.order.findMany({
            where: { userId },
            include: {
                OrderItem: {
                    include: {
                        product: {
                            select: { id: true, name: true, imageUrl: true },
                        },
                    },
                },
                shop: {
                    select: { id: true, name: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return orders;
    }

    async getOrderById(orderId: string, userId: string, role: string, shopId?: string) {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                OrderItem: {
                    include: {
                        product: {
                            select: { id: true, name: true, imageUrl: true },
                        },
                    },
                },
                user: {
                    select: { id: true, email: true, firstName: true, lastName: true },
                },
                shop: {
                    select: { id: true, name: true },
                },
            },
        });

        if (!order) {
            throw new AppError('Order not found', 404);
        }

        // Authorization
        if (role === 'CUSTOMER' && order.userId !== userId) {
            throw new AppError('Unauthorized to view this order', 403);
        }

        if (role === 'SHOP_ADMIN' && order.shopId !== shopId) {
            throw new AppError('Unauthorized to view this order', 403);
        }

        return order;
    }

    /**
     * Get all orders for a shop (SHOP_ADMIN) or all orders (HOODAL_ADMIN)
     */
    async getAllOrders(filters?: OrderFilterInput & { shopId?: string }) {
        const where: any = { orderType: 'ONLINE' };

        if (filters?.shopId) {
            where.shopId = filters.shopId;
        }

        if (filters?.status) {
            where.status = filters.status;
        }

        if (filters?.startDate || filters?.endDate) {
            where.createdAt = {};
            if (filters.startDate) {
                where.createdAt.gte = new Date(filters.startDate);
            }
            if (filters.endDate) {
                where.createdAt.lte = new Date(filters.endDate);
            }
        }

        const orders = await prisma.order.findMany({
            where,
            include: {
                OrderItem: {
                    include: {
                        product: {
                            select: { id: true, name: true, imageUrl: true },
                        },
                    },
                },
                user: {
                    select: { id: true, email: true, firstName: true, lastName: true },
                },
                shop: {
                    select: { id: true, name: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return orders;
    }

    /**
     * Get POS sales only (for POS Sales tab)
     */
    async getPOSSales(shopId: string, startDate?: string, endDate?: string) {
        const where: any = { shopId, orderType: 'POS' };

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate);
            if (endDate) where.createdAt.lte = new Date(endDate);
        }

        const orders = await prisma.order.findMany({
            where,
            include: {
                OrderItem: {
                    include: {
                        product: {
                            select: { id: true, name: true, imageUrl: true },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return orders;
    }

    async updateOrderStatus(orderId: string, data: UpdateOrderStatusInput, shopId?: string) {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
        });

        if (!order) {
            throw new AppError('Order not found', 404);
        }

        if (shopId && order.shopId !== shopId) {
            throw new AppError('Unauthorized to update this order', 403);
        }

        const updateData: any = {
            status: data.status,
        };

        if (data.status === 'DELIVERED') {
            updateData.paymentStatus = 'COMPLETED';
        }

        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: updateData,
            include: {
                OrderItem: {
                    include: { product: true },
                },
                shop: {
                    select: { id: true, name: true },
                },
            },
        });

        return updatedOrder;
    }

    async cancelOrder(orderId: string, userId: string, role: string, shopId?: string) {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { OrderItem: true },
        });

        if (!order) {
            throw new AppError('Order not found', 404);
        }

        if (role === 'CUSTOMER' && order.userId !== userId) {
            throw new AppError('Unauthorized to cancel this order', 403);
        }

        if (role === 'SHOP_ADMIN' && order.shopId !== shopId) {
            throw new AppError('Unauthorized to cancel this order', 403);
        }

        if (role === 'CUSTOMER' && order.status !== 'PENDING') {
            throw new AppError('Can only cancel pending orders', 400);
        }

        if (order.status === 'DELIVERED' || order.status === 'CANCELLED') {
            throw new AppError('Cannot cancel this order', 400);
        }

        return await prisma.$transaction(async (tx) => {
            const cancelledOrder = await tx.order.update({
                where: { id: orderId },
                data: {
                    status: 'CANCELLED',
                    paymentStatus: 'FAILED',
                },
            });

            for (const item of order.OrderItem) {
                const product = await tx.product.findUnique({
                    where: { id: item.productId },
                });

                if (product) {
                    const previousQuantity = product.stockQuantity;
                    const newQuantity = previousQuantity + item.quantity;

                    await tx.product.update({
                        where: { id: item.productId },
                        data: { stockQuantity: newQuantity },
                    });

                    await tx.stockHistory.create({
                        data: {
                            productId: item.productId,
                            changeType: 'RETURN',
                            quantityChange: item.quantity,
                            previousQuantity,
                            newQuantity,
                            referenceType: 'ORDER_CANCELLATION',
                            referenceId: orderId,
                            notes: `Stock restored due to order cancellation ${order.orderNumber}`,
                            createdBy: userId,
                        },
                    });
                }
            }

            return cancelledOrder;
        });
    }

    /**
     * Customer confirms they received their order (OUT_FOR_DELIVERY -> DELIVERED)
     */
    async confirmDelivery(orderId: string, userId: string) {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
        });

        if (!order) {
            throw new AppError('Order not found', 404);
        }

        if (order.userId !== userId) {
            throw new AppError('Unauthorized to confirm this order', 403);
        }

        if (order.status !== 'OUT_FOR_DELIVERY') {
            throw new AppError('Order is not out for delivery', 400);
        }

        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: {
                status: 'DELIVERED',
                paymentStatus: 'COMPLETED',
            },
            include: {
                OrderItem: {
                    include: { product: true },
                },
                shop: {
                    select: { id: true, name: true },
                },
            },
        });

        return updatedOrder;
    }
}

export const orderService = new OrderService();
