import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import {
    getPurchases,
    getPurchaseById,
    createPurchase,
    updatePurchasePayment
} from "../controllers/purchaseController";

const router = Router();

// Purchase routes require authentication and SHOP_ADMIN / HOODAL_ADMIN roles
router.use(authenticate);
router.use(authorize(["SHOP_ADMIN", "HOODAL_ADMIN"]));

router.route("/")
    .get(getPurchases)
    .post(createPurchase);

router.route("/:id")
    .get(getPurchaseById);

router.post("/:id/payments", updatePurchasePayment);

export default router;
