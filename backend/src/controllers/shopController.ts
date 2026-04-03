import { Request, Response, NextFunction } from 'express';
import { shopService } from '../services/shopService';
import { AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const createShopSchema = z.object({
    name: z.string().min(1, 'Shop name is required'),
    description: z.string().optional(),
    address: z.string().optional(),
    phone: z.string().optional(),
    adminEmail: z.string().email('Valid email required'),
    adminPassword: z.string().min(6, 'Password must be at least 6 characters'),
    adminFirstName: z.string().min(1, 'First name required'),
    adminLastName: z.string().min(1, 'Last name required'),
});

const updateShopSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    address: z.string().optional(),
    phone: z.string().optional(),
    imageUrl: z.string().optional(),
    deliverySlots: z.string().optional(),
    latitude: z.number().nullable().optional(),
    longitude: z.number().nullable().optional(),
});

export class ShopController {
    async getAllShops(req: Request, res: Response, next: NextFunction) {
        try {
            const authReq = req as AuthRequest;
            const includeInactive = authReq.user?.role === 'HOODAL_ADMIN';
            const shops = await shopService.getAllShops(includeInactive);
            res.json({ success: true, data: shops });
        } catch (error) {
            next(error);
        }
    }

    async getShopById(req: Request, res: Response, next: NextFunction) {
        try {
            const shop = await shopService.getShopById(req.params.id);
            res.json({ success: true, data: shop });
        } catch (error) {
            next(error);
        }
    }

    async createShop(req: Request, res: Response, next: NextFunction) {
        try {
            const validatedData = createShopSchema.parse(req.body);
            const result = await shopService.createShop(validatedData);
            res.status(201).json({
                success: true,
                message: 'Shop onboarded successfully',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async updateShop(req: Request, res: Response, next: NextFunction) {
        try {
            const validatedData = updateShopSchema.parse(req.body);
            const shop = await shopService.updateShop(req.params.id, validatedData);
            res.json({ success: true, data: shop });
        } catch (error) {
            next(error);
        }
    }

    async toggleShopStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const authReq = req as AuthRequest;
            const shopId = req.params.id;
            
            // Check ownership unless HOODAL_ADMIN
            if (authReq.user?.role !== 'HOODAL_ADMIN') {
                if (authReq.user?.shopId !== shopId) {
                    return res.status(403).json({ success: false, message: 'Forbidden' });
                }
            }

            const shop = await shopService.toggleShopStatus(shopId);
            res.json({
                success: true,
                message: `Shop ${shop.isActive ? 'activated' : 'deactivated'}`,
                data: shop,
            });
        } catch (error) {
            next(error);
        }
    }

    async getShopStats(req: Request, res: Response, next: NextFunction) {
        try {
            const authReq = req as AuthRequest;
            const shopId = req.params.id || authReq.user?.shopId;
            if (!shopId) {
                return res.status(400).json({ success: false, message: 'Shop ID required' });
            }
            const stats = await shopService.getShopStats(shopId);
            res.json({ success: true, data: stats });
        } catch (error) {
            next(error);
        }
    }

    async getDailySummary(req: Request, res: Response, next: NextFunction) {
        try {
            const authReq = req as AuthRequest;
            // Users should fetch their own shop's daily summary
            const shopId = authReq.user?.shopId;
            if (!shopId) {
                return res.status(400).json({ success: false, message: 'Shop ID required' });
            }
            const summary = await shopService.getDailySummary(shopId);
            res.json({ success: true, data: summary });
        } catch (error) {
            next(error);
        }
    }

    async getGSTSummary(req: Request, res: Response, next: NextFunction) {
        try {
            const authReq = req as AuthRequest;
            const shopId = authReq.user?.shopId;
            if (!shopId) {
                return res.status(400).json({ success: false, message: 'Shop ID required' });
            }
            const { startDate, endDate } = req.query as any;
            const summary = await shopService.getGSTSummary(shopId, startDate, endDate);
            res.json({ success: true, data: summary });
        } catch (error) {
            next(error);
        }
    }
}

export const shopController = new ShopController();
