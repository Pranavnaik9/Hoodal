import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { AddToCartInput, UpdateCartItemInput } from '../validators/cartValidator';

const prisma = new PrismaClient();

export class CartService {
    /**
     * Get cart for a user at a specific shop (or create one)
     */
    async getCart(userId: string, shopId: string) {
        let cart = await prisma.cart.findFirst({
            where: { userId, shopId },
            include: {
                CartItem: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                price: true,
                                imageUrl: true,
                                stockQuantity: true,
                                isActive: true,
                            },
                        },
                    },
                },
                shop: {
                    select: { id: true, name: true, deliverySlots: true },
                },
            },
        });

        if (!cart) {
            cart = await prisma.cart.create({
                data: { userId, shopId },
                include: {
                    CartItem: {
                        include: {
                            product: {
                                select: {
                                    id: true,
                                    name: true,
                                    price: true,
                                    imageUrl: true,
                                    stockQuantity: true,
                                    isActive: true,
                                },
                            },
                        },
                    },
                    shop: {
                        select: { id: true, name: true, deliverySlots: true },
                    },
                },
            });
        }

        return cart;
    }

    /**
     * Get all carts for a user (across shops)
     */
    async getAllCarts(userId: string) {
        const carts = await prisma.cart.findMany({
            where: { userId },
            include: {
                CartItem: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                price: true,
                                imageUrl: true,
                                stockQuantity: true,
                                isActive: true,
                            },
                        },
                    },
                },
                shop: {
                    select: { id: true, name: true, deliverySlots: true },
                },
            },
        });

        // Return only carts that have items
        return carts.filter(c => c.CartItem.length > 0);
    }

    async addToCart(userId: string, shopId: string, data: AddToCartInput) {
        const cart = await this.getCart(userId, shopId);

        const product = await prisma.product.findUnique({
            where: { id: data.productId },
        });

        if (!product) {
            throw new AppError('Product not found', 404);
        }

        if (!product.isActive) {
            throw new AppError('Product is not available', 400);
        }

        if (product.shopId !== shopId) {
            throw new AppError('Product does not belong to this shop', 400);
        }

        if (product.stockQuantity < data.quantity) {
            throw new AppError('Insufficient stock', 400);
        }

        const existingItem = await prisma.cartItem.findFirst({
            where: {
                cartId: cart.id,
                productId: data.productId,
            },
        });

        if (existingItem) {
            const newQuantity = existingItem.quantity + data.quantity;

            if (product.stockQuantity < newQuantity) {
                throw new AppError('Insufficient stock', 400);
            }

            const updatedItem = await prisma.cartItem.update({
                where: { id: existingItem.id },
                data: { quantity: newQuantity },
                include: { product: true },
            });

            return updatedItem;
        } else {
            const cartItem = await prisma.cartItem.create({
                data: {
                    cartId: cart.id,
                    productId: data.productId,
                    quantity: data.quantity,
                    price: product.price,
                },
                include: { product: true },
            });

            return cartItem;
        }
    }

    async updateCartItem(userId: string, itemId: string, data: UpdateCartItemInput) {
        const cartItem = await prisma.cartItem.findUnique({
            where: { id: itemId },
            include: {
                cart: true,
                product: true,
            },
        });

        if (!cartItem) {
            throw new AppError('Cart item not found', 404);
        }

        if (cartItem.cart.userId !== userId) {
            throw new AppError('Unauthorized', 403);
        }

        if (cartItem.product.stockQuantity < data.quantity) {
            throw new AppError('Insufficient stock', 400);
        }

        const updated = await prisma.cartItem.update({
            where: { id: itemId },
            data: { quantity: data.quantity },
            include: { product: true },
        });

        return updated;
    }

    async removeFromCart(userId: string, itemId: string) {
        const cartItem = await prisma.cartItem.findUnique({
            where: { id: itemId },
            include: { cart: true },
        });

        if (!cartItem) {
            throw new AppError('Cart item not found', 404);
        }

        if (cartItem.cart.userId !== userId) {
            throw new AppError('Unauthorized', 403);
        }

        await prisma.cartItem.delete({
            where: { id: itemId },
        });

        return { message: 'Item removed from cart' };
    }

    async clearCart(userId: string, shopId: string) {
        const cart = await prisma.cart.findFirst({
            where: { userId, shopId },
        });

        if (!cart) {
            return { message: 'Cart already empty' };
        }

        await prisma.cartItem.deleteMany({
            where: { cartId: cart.id },
        });

        return { message: 'Cart cleared' };
    }
}

export const cartService = new CartService();
