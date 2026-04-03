import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export class UserAddressController {
    // Get all addresses
    async getAddresses(req: Request, res: Response, next: NextFunction) {
        try {
            const authReq = req as AuthRequest;
            const userId = authReq.user!.userId;

            const addresses = await prisma.userAddress.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
            });

            res.json({ success: true, data: addresses });
        } catch (error) {
            next(error);
        }
    }

    // Add new address
    async addAddress(req: Request, res: Response, next: NextFunction) {
        try {
            const authReq = req as AuthRequest;
            const userId = authReq.user!.userId;
            const data = req.body;

            // If it's default, we need to unset previous defaults
            if (data.isDefault) {
                await prisma.userAddress.updateMany({
                    where: { userId, isDefault: true },
                    data: { isDefault: false },
                });
            } else {
                // If it's the first address, make it default automatically
                const count = await prisma.userAddress.count({ where: { userId } });
                if (count === 0) data.isDefault = true;
            }

            const address = await prisma.userAddress.create({
                data: {
                    userId,
                    label: data.label || 'HOME',
                    name: data.name,
                    phone: data.phone,
                    address: data.address,
                    city: data.city,
                    state: data.state,
                    pincode: data.pincode,
                    isDefault: data.isDefault || false,
                },
            });

            res.status(201).json({ success: true, message: 'Address added', data: address });
        } catch (error) {
            next(error);
        }
    }

    // Update address
    async updateAddress(req: Request, res: Response, next: NextFunction) {
        try {
            const authReq = req as AuthRequest;
            const userId = authReq.user!.userId;
            const { id } = req.params;
            const data = req.body;

            // Ensure ownership
            const existing = await prisma.userAddress.findFirst({ where: { id, userId } });
            if (!existing) return res.status(404).json({ success: false, error: 'Address not found' });

            if (data.isDefault) {
                await prisma.userAddress.updateMany({
                    where: { userId, isDefault: true, id: { not: id } },
                    data: { isDefault: false },
                });
            }

            const address = await prisma.userAddress.update({
                where: { id },
                data: {
                    label: data.label,
                    name: data.name,
                    phone: data.phone,
                    address: data.address,
                    city: data.city,
                    state: data.state,
                    pincode: data.pincode,
                    isDefault: data.isDefault !== undefined ? data.isDefault : undefined,
                },
            });

            res.json({ success: true, message: 'Address updated', data: address });
        } catch (error) {
            next(error);
        }
    }

    // Delete address
    async deleteAddress(req: Request, res: Response, next: NextFunction) {
        try {
            const authReq = req as AuthRequest;
            const userId = authReq.user!.userId;
            const { id } = req.params;

            // Ensure ownership and delete using deleteMany
            const result = await prisma.userAddress.deleteMany({
                where: { id, userId },
            });

            if (result.count === 0) {
                 return res.status(404).json({ success: false, error: 'Address not found' });
            }

            res.json({ success: true, message: 'Address deleted' });
        } catch (error) {
            next(error);
        }
    }
}

export const userAddressController = new UserAddressController();
