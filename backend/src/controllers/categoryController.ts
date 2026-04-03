import { Request, Response } from 'express';
import { categoryService } from '../services/categoryService';
import {
    createCategorySchema,
    updateCategorySchema,
} from '../validators/productValidator';
import { AuthRequest } from '../middleware/auth';

export class CategoryController {
    async getAllCategories(req: Request, res: Response) {
        const { shopId } = req.query;
        const authReq = req as AuthRequest;

        let resolvedShopId = shopId as string | undefined;
        if (authReq.user?.role === 'SHOP_ADMIN') {
            resolvedShopId = authReq.user.shopId;
        }

        const categories = await categoryService.getAllCategories(resolvedShopId);
        res.json(categories);
    }

    async getCategoryById(req: Request, res: Response) {
        const { id } = req.params;
        const category = await categoryService.getCategoryById(id);
        res.json(category);
    }

    async createCategory(req: Request, res: Response) {
        const authReq = req as AuthRequest;
        const validatedData = createCategorySchema.parse(req.body);
        const shopId = authReq.user!.shopId!;
        const category = await categoryService.createCategory({ ...validatedData, shopId });
        res.status(201).json(category);
    }

    async updateCategory(req: Request, res: Response) {
        const { id } = req.params;
        const authReq = req as AuthRequest;
        const validatedData = updateCategorySchema.parse(req.body);
        const category = await categoryService.updateCategory(id, validatedData, authReq.user!.shopId);
        res.json(category);
    }

    async deleteCategory(req: Request, res: Response) {
        const { id } = req.params;
        const authReq = req as AuthRequest;
        const result = await categoryService.deleteCategory(id, authReq.user!.shopId);
        res.json(result);
    }
}

export const categoryController = new CategoryController();
