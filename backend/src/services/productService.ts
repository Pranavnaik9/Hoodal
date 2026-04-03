import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import {
    CreateProductInput,
    UpdateProductInput,
    UpdateStockInput,
} from '../validators/productValidator';

const prisma = new PrismaClient();

export class ProductService {
    async getAllProducts(filters?: {
        categoryId?: string;
        shopId?: string;
        isActive?: boolean;
        search?: string;
    }) {
        const where: any = {};

        if (filters?.categoryId) {
            where.categoryId = filters.categoryId;
        }

        if (filters?.shopId) {
            where.shopId = filters.shopId;
        }

        if (filters?.isActive !== undefined) {
            where.isActive = filters.isActive;
        }

        if (filters?.search) {
            where.OR = [
                { name: { contains: filters.search } },
                { description: { contains: filters.search } },
            ];
        }

        const products = await prisma.product.findMany({
            where,
            include: {
                category: {
                    select: { id: true, name: true },
                },
                shop: {
                    select: { id: true, name: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return products;
    }

    async getProductById(id: string) {
        const product = await prisma.product.findUnique({
            where: { id },
            include: {
                category: {
                    select: { id: true, name: true, description: true },
                },
                shop: {
                    select: { id: true, name: true },
                },
            },
        });

        if (!product) {
            throw new AppError('Product not found', 404);
        }

        return product;
    }

    async createProduct(data: CreateProductInput & { shopId: string }) {
        if (data.categoryId) {
            const category = await prisma.category.findUnique({
                where: { id: data.categoryId },
            });
            if (!category) {
                throw new AppError('Category not found', 404);
            }
        }

        const product = await prisma.product.create({
            data: {
                name: data.name,
                description: data.description,
                categoryId: data.categoryId,
                shopId: data.shopId,
                price: data.price,
                costPrice: data.costPrice,
                gstRate: data.gstRate,
                marginPercent: data.marginPercent,
                stockQuantity: data.stockQuantity,
                imageUrl: data.imageUrl,
                isActive: data.isActive,
            },
            include: {
                category: { select: { id: true, name: true } },
                shop: { select: { id: true, name: true } },
            },
        });

        return product;
    }

    async updateProduct(id: string, data: UpdateProductInput, shopId?: string) {
        const existingProduct = await prisma.product.findUnique({
            where: { id },
        });

        if (!existingProduct) {
            throw new AppError('Product not found', 404);
        }

        // Ensure shop admin can only update their own products
        if (shopId && existingProduct.shopId !== shopId) {
            throw new AppError('Unauthorized to update this product', 403);
        }

        if (data.categoryId) {
            const category = await prisma.category.findUnique({
                where: { id: data.categoryId },
            });
            if (!category) {
                throw new AppError('Category not found', 404);
            }
        }

        const product = await prisma.product.update({
            where: { id },
            data: {
                ...data,
                ...(data.categoryId ? { categoryId: data.categoryId } : {}),
            },
            include: {
                category: { select: { id: true, name: true } },
                shop: { select: { id: true, name: true } },
            },
        });

        return product;
    }

    async deleteProduct(id: string, shopId?: string) {
        const product = await prisma.product.findUnique({
            where: { id },
        });

        if (!product) {
            throw new AppError('Product not found', 404);
        }

        if (shopId && product.shopId !== shopId) {
            throw new AppError('Unauthorized to delete this product', 403);
        }

        await prisma.product.update({
            where: { id },
            data: { isActive: false },
        });

        return { message: 'Product deleted successfully' };
    }

    async updateStock(id: string, data: UpdateStockInput, userId: string, shopId?: string) {
        const product = await prisma.product.findUnique({
            where: { id },
        });

        if (!product) {
            throw new AppError('Product not found', 404);
        }

        if (shopId && product.shopId !== shopId) {
            throw new AppError('Unauthorized to update stock', 403);
        }

        const previousQuantity = product.stockQuantity;
        const newQuantity = previousQuantity + data.quantity;

        if (newQuantity < 0) {
            throw new AppError('Insufficient stock', 400);
        }

        const result = await prisma.$transaction([
            prisma.product.update({
                where: { id },
                data: { stockQuantity: newQuantity },
            }),
            prisma.stockHistory.create({
                data: {
                    productId: id,
                    changeType: data.changeType,
                    quantityChange: data.quantity,
                    previousQuantity,
                    newQuantity,
                    notes: data.notes,
                    createdBy: userId,
                },
            }),
        ]);

        return result[0];
    }

    async getStockHistory(productId: string) {
        const history = await prisma.stockHistory.findMany({
            where: { productId },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return history;
    }

    async bulkUpdatePrices(updates: { productId: string; price?: number; costPrice?: number; gstRate?: number }[], shopId: string) {
        // Verify all products belong to the shop
        const productIds = updates.map(u => u.productId);
        const products = await prisma.product.findMany({
            where: { id: { in: productIds }, shopId },
            select: { id: true },
        });

        if (products.length !== productIds.length) {
            throw new AppError('Some products not found or do not belong to your shop', 404);
        }

        // Update each product in a transaction
        const result = await prisma.$transaction(
            updates.map(u => {
                const data: any = {};
                if (u.price !== undefined) data.price = u.price;
                if (u.costPrice !== undefined) data.costPrice = u.costPrice;
                if (u.gstRate !== undefined) data.gstRate = u.gstRate;
                return prisma.product.update({
                    where: { id: u.productId },
                    data,
                });
            })
        );

        return { updated: result.length };
    }
}

export const productService = new ProductService();
