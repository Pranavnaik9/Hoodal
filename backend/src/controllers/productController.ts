import { Request, Response } from 'express';
import { productService } from '../services/productService';
import {
    createProductSchema,
    updateProductSchema,
    updateStockSchema,
} from '../validators/productValidator';
import { AuthRequest } from '../middleware/auth';

export class ProductController {
    async getAllProducts(req: Request, res: Response) {
        const { categoryId, shopId, isActive, search } = req.query;

        const filters: any = {};
        if (categoryId) filters.categoryId = categoryId as string;
        if (shopId) filters.shopId = shopId as string;
        if (isActive !== undefined) filters.isActive = isActive === 'true';
        if (search) filters.search = search as string;

        // If SHOP_ADMIN, scope to their shop
        const authReq = req as AuthRequest;
        if (authReq.user?.role === 'SHOP_ADMIN') {
            filters.shopId = authReq.user.shopId;
        }

        const products = await productService.getAllProducts(filters);
        res.json(products);
    }

    async getProductById(req: Request, res: Response) {
        const { id } = req.params;
        const product = await productService.getProductById(id);
        res.json(product);
    }

    async createProduct(req: Request, res: Response) {
        const authReq = req as AuthRequest;
        const validatedData = createProductSchema.parse(req.body);
        const shopId = authReq.user!.shopId!;
        const product = await productService.createProduct({ ...validatedData, shopId });
        res.status(201).json(product);
    }

    async updateProduct(req: Request, res: Response) {
        const { id } = req.params;
        const authReq = req as AuthRequest;
        const validatedData = updateProductSchema.parse(req.body);
        const product = await productService.updateProduct(id, validatedData, authReq.user!.shopId);
        res.json(product);
    }

    async deleteProduct(req: Request, res: Response) {
        const { id } = req.params;
        const authReq = req as AuthRequest;
        const result = await productService.deleteProduct(id, authReq.user!.shopId);
        res.json(result);
    }

    async updateStock(req: Request, res: Response) {
        const { id } = req.params;
        const validatedData = updateStockSchema.parse(req.body);
        const authReq = req as AuthRequest;
        const product = await productService.updateStock(
            id,
            validatedData,
            authReq.user!.userId,
            authReq.user!.shopId
        );
        res.json(product);
    }

    async getStockHistory(req: Request, res: Response) {
        const { id } = req.params;
        const history = await productService.getStockHistory(id);
        res.json(history);
    }

    async bulkUpdatePrices(req: Request, res: Response) {
        const authReq = req as AuthRequest;
        const shopId = authReq.user!.shopId!;
        const { updates } = req.body;

        if (!updates || !Array.isArray(updates)) {
            return res.status(400).json({ success: false, message: 'updates array is required' });
        }

        const result = await productService.bulkUpdatePrices(updates, shopId);
        res.json({ success: true, data: result });
    }
}

export const productController = new ProductController();
