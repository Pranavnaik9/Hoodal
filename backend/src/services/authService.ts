import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AppError } from '../middleware/errorHandler';
import { RegisterInput, LoginInput } from '../validators/authValidator';

const prisma = new PrismaClient();

export class AuthService {
    async register(data: RegisterInput) {
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email },
        });

        if (existingUser) {
            throw new AppError('Email already registered', 400);
        }

        const passwordHash = await bcrypt.hash(data.password, 10);

        const user = await prisma.user.create({
            data: {
                email: data.email,
                passwordHash,
                firstName: data.firstName,
                lastName: data.lastName,
                phone: data.phone,
                role: 'CUSTOMER',
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                role: true,
                shopId: true,
                createdAt: true,
            },
        });

        const token = this.generateToken(user.id, user.email, user.role, user.shopId);

        return { user, token };
    }

    async login(data: LoginInput) {
        const user = await prisma.user.findUnique({
            where: { email: data.email },
            include: {
                shop: {
                    select: { id: true, name: true },
                },
            },
        });

        if (!user || !user.isActive) {
            throw new AppError('Invalid credentials', 401);
        }

        const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);

        if (!isPasswordValid) {
            throw new AppError('Invalid credentials', 401);
        }

        const token = this.generateToken(user.id, user.email, user.role, user.shopId);

        return {
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                phone: user.phone,
                role: user.role,
                shopId: user.shopId,
                shopName: user.shop?.name || null,
            },
            token,
        };
    }

    async getMe(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                role: true,
                shopId: true,
                createdAt: true,
                shop: {
                    select: { id: true, name: true },
                },
            },
        });

        if (!user) {
            throw new AppError('User not found', 404);
        }

        return user;
    }

    async updateProfile(userId: string, data: { firstName?: string; lastName?: string; phone?: string; email?: string }) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new AppError('User not found', 404);

        // If email is being changed, check uniqueness
        if (data.email && data.email !== user.email) {
            const existing = await prisma.user.findUnique({ where: { email: data.email } });
            if (existing) throw new AppError('Email already in use', 400);
        }

        const updated = await prisma.user.update({
            where: { id: userId },
            data: {
                firstName: data.firstName,
                lastName: data.lastName,
                phone: data.phone,
                email: data.email,
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                role: true,
                shopId: true,
                createdAt: true,
                shop: { select: { id: true, name: true } },
            },
        });

        return updated;
    }

    async changePassword(userId: string, currentPassword: string, newPassword: string) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new AppError('User not found', 404);

        const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isValid) throw new AppError('Current password is incorrect', 400);

        const newHash = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: userId },
            data: { passwordHash: newHash },
        });

        return { message: 'Password changed successfully' };
    }

    private generateToken(userId: string, email: string, role: string, shopId?: string | null): string {
        return jwt.sign(
            { userId, email, role, shopId: shopId || undefined },
            config.jwt.secret,
            { expiresIn: '7d' }
        );
    }
}

export const authService = new AuthService();
