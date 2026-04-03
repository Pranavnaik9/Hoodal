import { Router } from 'express';
import { shopController } from '../controllers/shopController';
import { authenticate, authorizeHoodalAdmin, authorizeShopOrHoodal } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Public: list active shops
router.get('/', asyncHandler(shopController.getAllShops.bind(shopController)));
router.get('/:id', asyncHandler(shopController.getShopById.bind(shopController)));
router.get('/:id/stats', authenticate, asyncHandler(shopController.getShopStats.bind(shopController)));

// Shop Admin or Hoodal Admin
router.get(
    '/:id/daily-summary',
    authenticate,
    authorizeShopOrHoodal,
    asyncHandler(shopController.getDailySummary.bind(shopController))
);

router.get(
    '/:id/gst-summary',
    authenticate,
    authorizeShopOrHoodal,
    asyncHandler(shopController.getGSTSummary.bind(shopController))
);

// HOODAL_ADMIN only
router.post(
    '/',
    authenticate,
    authorizeHoodalAdmin,
    asyncHandler(shopController.createShop.bind(shopController))
);

router.put(
    '/:id',
    authenticate,
    authorizeShopOrHoodal,
    asyncHandler(shopController.updateShop.bind(shopController))
);

router.patch(
    '/:id/toggle',
    authenticate,
    authorizeShopOrHoodal,
    asyncHandler(shopController.toggleShopStatus.bind(shopController))
);

export default router;
