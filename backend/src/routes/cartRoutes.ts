import { Router } from 'express';
import { cartController } from '../controllers/cartController';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// All cart routes require authentication
router.use(authenticate);

router.get('/', asyncHandler(cartController.getCart.bind(cartController)));
router.post('/items', asyncHandler(cartController.addToCart.bind(cartController)));
router.put('/items/:id', asyncHandler(cartController.updateCartItem.bind(cartController)));
router.delete('/items/:id', asyncHandler(cartController.removeFromCart.bind(cartController)));
router.delete('/', asyncHandler(cartController.clearCart.bind(cartController)));

export default router;
