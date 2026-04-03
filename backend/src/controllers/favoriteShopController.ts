import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

export class FavoriteShopController {
    // Get all favorite shops for the logged-in user
    async getFavorites(req: Request, res: Response, next: NextFunction) {
        try {
            const authReq = req as AuthRequest;
            const userId = authReq.user!.userId;

            const favorites = await prisma.favoriteShop.findMany({
                where: { userId },
                include: {
                    shop: true,
                },
                orderBy: { createdAt: 'desc' },
            });

            res.json({ success: true, data: favorites });
        } catch (error) {
            next(error);
        }
    }

    // Add a shop to favorites
    async addFavorite(req: Request, res: Response, next: NextFunction) {
        try {
            const authReq = req as AuthRequest;
            const userId = authReq.user!.userId;
            const { shopId } = req.body;

            if (!shopId) {
                return res.status(400).json({ success: false, error: 'Shop ID is required' });
            }

            // Check if shop exists
            const shop = await prisma.shop.findUnique({ where: { id: shopId } });
            if (!shop) {
                return res.status(404).json({ success: false, error: 'Shop not found' });
            }

            // Upsert to handle unique constraint safely
            const favorite = await prisma.favoriteShop.upsert({
                where: {
                    userId_shopId: {
                        userId,
                        shopId,
                    },
                },
                update: {},
                create: {
                    userId,
                    shopId,
                },
                include: { shop: true }
            });

            res.status(201).json({ success: true, message: 'Shop added to favorites', data: favorite });
        } catch (error) {
            next(error);
        }
    }

    // Remove a shop from favorites
    async removeFavorite(req: Request, res: Response, next: NextFunction) {
        try {
            const authReq = req as AuthRequest;
            const userId = authReq.user!.userId;
            const { shopId } = req.params;

            await prisma.favoriteShop.delete({
                where: {
                    userId_shopId: {
                        userId,
                        shopId,
                    },
                },
            }).catch(() => {
                // Ignore if it doesn't exist
            });

            res.json({ success: true, message: 'Shop removed from favorites' });
        } catch (error) {
            next(error);
        }
    }
}

export const favoriteShopController = new FavoriteShopController();
