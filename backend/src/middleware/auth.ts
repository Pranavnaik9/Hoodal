import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface AuthRequest extends Request {
    user?: {
        userId: string;
        email: string;
        role: string;
        shopId?: string;
    };
}

export const authenticate = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'No token provided',
            });
        }

        const token = authHeader.substring(7);

        const decoded = jwt.verify(token, config.jwt.secret) as {
            userId: string;
            email: string;
            role: string;
            shopId?: string;
        };

        (req as AuthRequest).user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token',
        });
    }
};

export const optionalAuthenticate = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const decoded = jwt.verify(token, config.jwt.secret) as any;
            (req as AuthRequest).user = decoded;
        }
        next();
    } catch (error) {
        // If token is invalid, just proceed as guest
        next();
    }
};

export const authorize = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const authReq = req as AuthRequest;

        if (!authReq.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required',
            });
        }

        if (!roles.includes(authReq.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions',
            });
        }

        next();
    };
};

// Role-specific middleware
export const authorizeAdmin = authorize(['ADMIN', 'SHOP_ADMIN']);
export const authorizeHoodalAdmin = authorize(['HOODAL_ADMIN']);
export const authorizeShopAdmin = authorize(['SHOP_ADMIN']);
export const authorizeShopOrHoodal = authorize(['HOODAL_ADMIN', 'SHOP_ADMIN']);
