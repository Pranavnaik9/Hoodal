import { Router } from 'express';
import { userAddressController } from '../controllers/userAddressController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', userAddressController.getAddresses.bind(userAddressController));
router.post('/', userAddressController.addAddress.bind(userAddressController));
router.put('/:id', userAddressController.updateAddress.bind(userAddressController));
router.delete('/:id', userAddressController.deleteAddress.bind(userAddressController));

export default router;
