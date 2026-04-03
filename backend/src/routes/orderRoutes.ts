import { Router } from 'express';
import { orderController } from '../controllers/orderController';
import { authenticate, authorizeShopOrHoodal } from '../middleware/auth';

const router = Router();

// Customer routes (authenticated)
router.post('/', authenticate, (req, res) => orderController.createOrder(req, res));
router.get('/', authenticate, (req, res) => orderController.getCustomerOrders(req, res));
router.get('/:id', authenticate, (req, res) => orderController.getOrderById(req, res));
router.put('/:id/cancel', authenticate, (req, res) => orderController.cancelOrder(req, res));
router.put('/:id/confirm-delivery', authenticate, (req, res) => orderController.confirmDelivery(req, res));

// Admin routes (SHOP_ADMIN or HOODAL_ADMIN)
router.post('/admin/pos', authenticate, authorizeShopOrHoodal, (req, res) =>
    orderController.createPOSOrder(req, res)
);
router.get('/admin/pos-sales', authenticate, authorizeShopOrHoodal, (req, res) =>
    orderController.getPOSSales(req, res)
);
router.get('/admin/all', authenticate, authorizeShopOrHoodal, (req, res) =>
    orderController.getAllOrders(req, res)
);
router.put('/admin/:id', authenticate, authorizeShopOrHoodal, (req, res) =>
    orderController.updateOrderStatus(req, res)
);

export default router;
