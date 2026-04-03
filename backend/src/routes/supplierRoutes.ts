import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import {
    getSuppliers,
    getSupplierById,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    addSupplierPayment
} from "../controllers/supplierController";

const router = Router();

// All supplier routes require authentication and SHOP_ADMIN / HOODAL_ADMIN roles
router.use(authenticate);
router.use(authorize(["SHOP_ADMIN", "HOODAL_ADMIN"]));

router.route("/")
    .get(getSuppliers)
    .post(createSupplier);

router.route("/:id")
    .get(getSupplierById)
    .put(updateSupplier)
    .delete(deleteSupplier);

router.post("/:id/payments", addSupplierPayment);

export default router;
