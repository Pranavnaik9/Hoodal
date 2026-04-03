import { Router } from 'express';
import { productController } from '../controllers/productController';
import { authenticate, authorizeShopAdmin, optionalAuthenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Public routes (optionally authenticated to filter for Shop Admins)
router.get('/', optionalAuthenticate, asyncHandler(productController.getAllProducts.bind(productController)));
router.get('/:id', asyncHandler(productController.getProductById.bind(productController)));

// Shop Admin only routes
router.post(
    '/',
    authenticate,
    authorizeShopAdmin,
    asyncHandler(productController.createProduct.bind(productController))
);

router.put(
    '/bulk-update',
    authenticate,
    authorizeShopAdmin,
    asyncHandler(productController.bulkUpdatePrices.bind(productController))
);

router.put(
    '/:id',
    authenticate,
    authorizeShopAdmin,
    asyncHandler(productController.updateProduct.bind(productController))
);

router.delete(
    '/:id',
    authenticate,
    authorizeShopAdmin,
    asyncHandler(productController.deleteProduct.bind(productController))
);

router.put(
    '/:id/stock',
    authenticate,
    authorizeShopAdmin,
    asyncHandler(productController.updateStock.bind(productController))
);

router.get(
    '/:id/stock-history',
    authenticate,
    authorizeShopAdmin,
    asyncHandler(productController.getStockHistory.bind(productController))
);

export default router;
