import { Router } from 'express';
import { favoriteShopController } from '../controllers/favoriteShopController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All favorite routes require authentication
router.use(authenticate);

router.get('/', favoriteShopController.getFavorites.bind(favoriteShopController));
router.post('/', favoriteShopController.addFavorite.bind(favoriteShopController));
router.delete('/:shopId', favoriteShopController.removeFavorite.bind(favoriteShopController));

export default router;
