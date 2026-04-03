import { Router } from 'express';
import { uploadController } from '../controllers/uploadController';
import { upload } from '../middleware/upload';
import { authenticate, authorizeAdmin } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

router.post(
    '/',
    authenticate,
    authorizeAdmin,
    upload.single('image'),
    asyncHandler(uploadController.uploadImage.bind(uploadController))
);

export default router;
