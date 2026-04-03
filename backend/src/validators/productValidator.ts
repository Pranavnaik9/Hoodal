import { z } from 'zod';

export const createProductSchema = z.object({
    name: z.string().min(1, 'Product name is required').max(255),
    description: z.string().optional(),
    categoryId: z.string().uuid('Invalid category ID').optional(),
    price: z.number().positive('Price must be positive'),
    costPrice: z.number().min(0).optional().default(0),
    gstRate: z.number().min(0).max(100).optional().default(0),
    marginPercent: z.number().min(0).optional().nullable(),
    stockQuantity: z.number().int().min(0, 'Stock cannot be negative').default(0),
    imageUrl: z.string().url('Invalid image URL').optional(),
    isActive: z.boolean().default(true),
});

export const updateProductSchema = z.object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().optional(),
    categoryId: z.string().uuid().optional().nullable(),
    price: z.number().positive().optional(),
    costPrice: z.number().min(0).optional(),
    gstRate: z.number().min(0).max(100).optional(),
    marginPercent: z.number().min(0).optional().nullable(),
    stockQuantity: z.number().int().min(0).optional(),
    imageUrl: z.string().url().optional().nullable(),
    isActive: z.boolean().optional(),
});

export const updateStockSchema = z.object({
    quantity: z.number().int(),
    changeType: z.enum(['add', 'sale', 'adjustment']),
    notes: z.string().optional(),
});

export const createCategorySchema = z.object({
    name: z.string().min(1, 'Category name is required').max(100),
    description: z.string().optional(),
});

export const updateCategorySchema = z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type UpdateStockInput = z.infer<typeof updateStockSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
