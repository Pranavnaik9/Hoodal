import { Router } from 'express';
import { categoryController } from '../controllers/categoryController';
import { authenticate, authorizeShopAdmin } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Public routes
router.get('/', asyncHandler(categoryController.getAllCategories.bind(categoryController)));
router.get('/:id', asyncHandler(categoryController.getCategoryById.bind(categoryController)));

// Shop Admin only
router.post(
    '/',
    authenticate,
    authorizeShopAdmin,
    asyncHandler(categoryController.createCategory.bind(categoryController))
);

router.put(
    '/:id',
    authenticate,
    authorizeShopAdmin,
    asyncHandler(categoryController.updateCategory.bind(categoryController))
);

router.delete(
    '/:id',
    authenticate,
    authorizeShopAdmin,
    asyncHandler(categoryController.deleteCategory.bind(categoryController))
);

export default router;
