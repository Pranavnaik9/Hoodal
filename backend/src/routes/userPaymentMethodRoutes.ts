import { Router } from 'express';
import { userPaymentMethodController } from '../controllers/userPaymentMethodController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', userPaymentMethodController.getMethods.bind(userPaymentMethodController));
router.post('/', userPaymentMethodController.addMethod.bind(userPaymentMethodController));
router.delete('/:id', userPaymentMethodController.deleteMethod.bind(userPaymentMethodController));

export default router;
