import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';
import { registerSchema, loginSchema } from '../validators/authValidator';
import { AuthRequest } from '../middleware/auth';

export class AuthController {
    async register(req: Request, res: Response, next: NextFunction) {
        try {
            // Validate input
            const validatedData = registerSchema.parse(req.body);

            const result = await authService.register(validatedData);

            res.status(201).json({
                success: true,
                message: 'Registration successful',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async login(req: Request, res: Response, next: NextFunction) {
        try {
            // Validate input
            const validatedData = loginSchema.parse(req.body);

            const result = await authService.login(validatedData);

            res.status(200).json({
                success: true,
                message: 'Login successful',
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }

    async getMe(req: Request, res: Response, next: NextFunction) {
        try {
            const authReq = req as AuthRequest;
            const userId = authReq.user!.userId;

            const user = await authService.getMe(userId);

            res.status(200).json({
                success: true,
                data: user,
            });
        } catch (error) {
            next(error);
        }
    }

    async updateProfile(req: Request, res: Response, next: NextFunction) {
        try {
            const authReq = req as AuthRequest;
            const userId = authReq.user!.userId;
            const { firstName, lastName, phone, email } = req.body;

            const user = await authService.updateProfile(userId, { firstName, lastName, phone, email });

            res.status(200).json({
                success: true,
                message: 'Profile updated successfully',
                data: user,
            });
        } catch (error) {
            next(error);
        }
    }

    async changePassword(req: Request, res: Response, next: NextFunction) {
        try {
            const authReq = req as AuthRequest;
            const userId = authReq.user!.userId;
            const { currentPassword, newPassword } = req.body;

            if (!currentPassword || !newPassword) {
                return res.status(400).json({ success: false, error: 'Current password and new password are required' });
            }
            if (newPassword.length < 6) {
                return res.status(400).json({ success: false, error: 'New password must be at least 6 characters' });
            }

            const result = await authService.changePassword(userId, currentPassword, newPassword);

            res.status(200).json({
                success: true,
                message: result.message,
            });
        } catch (error) {
            next(error);
        }
    }

    async logout(req: Request, res: Response, next: NextFunction) {
        try {
            // For JWT, logout is handled client-side by removing the token
            res.status(200).json({
                success: true,
                message: 'Logout successful',
            });
        } catch (error) {
            next(error);
        }
    }
}

export const authController = new AuthController();
