import { Request, Response } from 'express';
import { orderService } from '../services/orderService';
import { checkoutSchema, updateOrderStatusSchema, orderFilterSchema, posCheckoutSchema } from '../validators/orderValidator';
import { AuthRequest } from '../middleware/auth';

export class OrderController {
    async createOrder(req: Request, res: Response) {
        try {
            const authReq = req as AuthRequest;
            const userId = authReq.user!.userId;
            const validatedData = checkoutSchema.parse(req.body);
            const { shopId } = req.body;

            if (!shopId) {
                return res.status(400).json({ success: false, message: 'shopId is required' });
            }

            const order = await orderService.createOrder(userId, shopId, validatedData);

            res.status(201).json({
                success: true,
                message: 'Order created successfully',
                data: order,
            });
        } catch (error: any) {
            res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || 'Failed to create order',
            });
        }
    }

    async getCustomerOrders(req: Request, res: Response) {
        try {
            const userId = (req as AuthRequest).user!.userId;
            const orders = await orderService.getCustomerOrders(userId);

            res.status(200).json({
                success: true,
                data: orders,
            });
        } catch (error: any) {
            res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || 'Failed to fetch orders',
            });
        }
    }

    async getOrderById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const authReq = req as AuthRequest;
            const userId = authReq.user!.userId;
            const role = authReq.user!.role;
            const shopId = authReq.user!.shopId;

            const order = await orderService.getOrderById(id, userId, role, shopId);

            res.status(200).json({
                success: true,
                data: order,
            });
        } catch (error: any) {
            res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || 'Failed to fetch order',
            });
        }
    }

    async cancelOrder(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const authReq = req as AuthRequest;
            const userId = authReq.user!.userId;
            const role = authReq.user!.role;
            const shopId = authReq.user!.shopId;

            const order = await orderService.cancelOrder(id, userId, role, shopId);

            res.status(200).json({
                success: true,
                message: 'Order cancelled successfully',
                data: order,
            });
        } catch (error: any) {
            res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || 'Failed to cancel order',
            });
        }
    }

    async getAllOrders(req: Request, res: Response) {
        try {
            const authReq = req as AuthRequest;
            const filters = orderFilterSchema.parse(req.query);

            // SHOP_ADMIN only sees own shop orders
            const shopId = authReq.user!.role === 'SHOP_ADMIN' ? authReq.user!.shopId : undefined;

            const orders = await orderService.getAllOrders({ ...filters, shopId });

            res.status(200).json({
                success: true,
                data: orders,
            });
        } catch (error: any) {
            res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || 'Failed to fetch orders',
            });
        }
    }

    async updateOrderStatus(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const authReq = req as AuthRequest;
            const validatedData = updateOrderStatusSchema.parse(req.body);
            const shopId = authReq.user!.role === 'SHOP_ADMIN' ? authReq.user!.shopId : undefined;

            const order = await orderService.updateOrderStatus(id, validatedData, shopId);

            res.status(200).json({
                success: true,
                message: 'Order status updated successfully',
                data: order,
            });
        } catch (error: any) {
            res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || 'Failed to update order status',
            });
        }
    }

    async createPOSOrder(req: Request, res: Response) {
        try {
            const authReq = req as AuthRequest;
            const adminId = authReq.user!.userId;
            const shopId = authReq.user!.role === 'SHOP_ADMIN' ? authReq.user!.shopId : req.body.shopId;

            if (!shopId) {
                return res.status(400).json({ success: false, message: 'shopId is required' });
            }

            const validatedData = posCheckoutSchema.parse(req.body);

            const order = await orderService.createPOSOrder(shopId, adminId, validatedData);

            res.status(201).json({
                success: true,
                message: 'POS Order created successfully',
                data: order,
            });
        } catch (error: any) {
            res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || 'Failed to create POS order',
            });
        }
    }

    async getPOSSales(req: Request, res: Response) {
        try {
            const authReq = req as AuthRequest;
            const shopId = authReq.user!.shopId;
            if (!shopId) {
                return res.status(400).json({ success: false, message: 'shopId is required' });
            }
            const { startDate, endDate } = req.query as any;
            const sales = await orderService.getPOSSales(shopId, startDate, endDate);
            res.status(200).json({ success: true, data: sales });
        } catch (error: any) {
            res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || 'Failed to fetch POS sales',
            });
        }
    }
    async confirmDelivery(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const authReq = req as AuthRequest;
            const userId = authReq.user!.userId;

            const order = await orderService.confirmDelivery(id, userId);

            res.status(200).json({
                success: true,
                message: 'Order delivery confirmed successfully',
                data: order,
            });
        } catch (error: any) {
            res.status(error.statusCode || 500).json({
                success: false,
                message: error.message || 'Failed to confirm delivery',
            });
        }
    }
}

export const orderController = new OrderController();
