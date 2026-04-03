import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import {
    CreateCategoryInput,
    UpdateCategoryInput,
} from '../validators/productValidator';

const prisma = new PrismaClient();

export class CategoryService {
    async getAllCategories(shopId?: string) {
        const where: any = {};
        if (shopId) {
            where.shopId = shopId;
        }

        const categories = await prisma.category.findMany({
            where,
            include: {
                _count: {
                    select: { Product: true },
                },
                shop: {
                    select: { id: true, name: true },
                },
            },
            orderBy: { name: 'asc' },
        });

        return categories;
    }

    async getCategoryById(id: string) {
        const category = await prisma.category.findUnique({
            where: { id },
            include: {
                Product: {
                    where: { isActive: true },
                    select: {
                        id: true,
                        name: true,
                        price: true,
                        imageUrl: true,
                        stockQuantity: true,
                    },
                },
                shop: {
                    select: { id: true, name: true },
                },
            },
        });

        if (!category) {
            throw new AppError('Category not found', 404);
        }

        return category;
    }

    async createCategory(data: CreateCategoryInput & { shopId: string }) {
        const category = await prisma.category.create({
            data: {
                name: data.name,
                description: data.description,
                shopId: data.shopId,
            },
        });

        return category;
    }

    async updateCategory(id: string, data: UpdateCategoryInput, shopId?: string) {
        const existingCategory = await prisma.category.findUnique({
            where: { id },
        });

        if (!existingCategory) {
            throw new AppError('Category not found', 404);
        }

        if (shopId && existingCategory.shopId !== shopId) {
            throw new AppError('Unauthorized to update this category', 403);
        }

        const category = await prisma.category.update({
            where: { id },
            data: { name: data.name, description: data.description },
        });

        return category;
    }

    async deleteCategory(id: string, shopId?: string) {
        const category = await prisma.category.findUnique({
            where: { id },
            include: {
                _count: { select: { Product: true } },
            },
        });

        if (!category) {
            throw new AppError('Category not found', 404);
        }

        if (shopId && category.shopId !== shopId) {
            throw new AppError('Unauthorized to delete this category', 403);
        }

        if (category._count.Product > 0) {
            throw new AppError('Cannot delete category with associated products', 400);
        }

        await prisma.category.delete({
            where: { id },
        });

        return { message: 'Category deleted successfully' };
    }
}

export const categoryService = new CategoryService();
