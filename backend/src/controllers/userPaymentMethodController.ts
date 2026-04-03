import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export class UserPaymentMethodController {
    // Get all payment methods
    async getMethods(req: Request, res: Response, next: NextFunction) {
        try {
            const authReq = req as AuthRequest;
            const userId = authReq.user!.userId;

            const methods = await prisma.userPaymentMethod.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
            });

            res.json({ success: true, data: methods });
        } catch (error) {
            next(error);
        }
    }

    // Add new payment method
    async addMethod(req: Request, res: Response, next: NextFunction) {
        try {
            const authReq = req as AuthRequest;
            const userId = authReq.user!.userId;
            const data = req.body;

            // Optional: If default, unset previous defaults
            if (data.isDefault) {
                await prisma.userPaymentMethod.updateMany({
                    where: { userId, isDefault: true },
                    data: { isDefault: false },
                });
            } else {
                const count = await prisma.userPaymentMethod.count({ where: { userId } });
                if (count === 0) data.isDefault = true;
            }

            const method = await prisma.userPaymentMethod.create({
                data: {
                    userId,
                    type: data.type, // 'UPI' or 'CARD'
                    provider: data.provider, // e.g., 'GPay', 'Visa'
                    identifier: data.identifier, // e.g., 'user@upi' or '**** 1234'
                    isDefault: data.isDefault || false,
                },
            });

            res.status(201).json({ success: true, message: 'Payment method added', data: method });
        } catch (error) {
            next(error);
        }
    }

    // Delete payment method
    async deleteMethod(req: Request, res: Response, next: NextFunction) {
        try {
            const authReq = req as AuthRequest;
            const userId = authReq.user!.userId;
            const { id } = req.params;

            const result = await prisma.userPaymentMethod.deleteMany({
                where: { id, userId },
            });

            if (result.count === 0) {
                 return res.status(404).json({ success: false, error: 'Payment method not found' });
            }

            res.json({ success: true, message: 'Payment method deleted' });
        } catch (error) {
            next(error);
        }
    }
}

export const userPaymentMethodController = new UserPaymentMethodController();
