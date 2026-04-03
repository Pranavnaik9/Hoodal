import { Request, Response } from 'express';
import { cartService } from '../services/cartService';
import { addToCartSchema, updateCartItemSchema } from '../validators/cartValidator';
import { AuthRequest } from '../middleware/auth';

export class CartController {
    async getCart(req: Request, res: Response) {
        const userId = (req as AuthRequest).user!.userId;
        const { shopId } = req.query;

        if (!shopId) {
            // Return all carts across shops
            const carts = await cartService.getAllCarts(userId);
            return res.json(carts);
        }

        const cart = await cartService.getCart(userId, shopId as string);
        res.json(cart);
    }

    async addToCart(req: Request, res: Response) {
        const userId = (req as AuthRequest).user!.userId;
        const validatedData = addToCartSchema.parse(req.body);
        const { shopId } = req.body;

        if (!shopId) {
            return res.status(400).json({ success: false, message: 'shopId is required' });
        }

        const cartItem = await cartService.addToCart(userId, shopId, validatedData);
        res.status(201).json(cartItem);
    }

    async updateCartItem(req: Request, res: Response) {
        const userId = (req as AuthRequest).user!.userId;
        const { id } = req.params;
        const validatedData = updateCartItemSchema.parse(req.body);
        const cartItem = await cartService.updateCartItem(userId, id, validatedData);
        res.json(cartItem);
    }

    async removeFromCart(req: Request, res: Response) {
        const userId = (req as AuthRequest).user!.userId;
        const { id } = req.params;
        const result = await cartService.removeFromCart(userId, id);
        res.json(result);
    }

    async clearCart(req: Request, res: Response) {
        const userId = (req as AuthRequest).user!.userId;
        const { shopId } = req.query;

        if (!shopId) {
            return res.status(400).json({ success: false, message: 'shopId is required' });
        }

        const result = await cartService.clearCart(userId, shopId as string);
        res.json(result);
    }
}

export const cartController = new CartController();
