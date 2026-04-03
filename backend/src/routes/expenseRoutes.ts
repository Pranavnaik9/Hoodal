import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import {
    getExpenses,
    getExpenseById,
    createExpense,
    updateExpense,
    deleteExpense
} from "../controllers/expenseController";

const router = Router();

// Expense routes require authentication and SHOP_ADMIN / HOODAL_ADMIN roles
router.use(authenticate);
router.use(authorize(["SHOP_ADMIN", "HOODAL_ADMIN"]));

router.route("/")
    .get(getExpenses)
    .post(createExpense);

router.route("/:id")
    .get(getExpenseById)
    .put(updateExpense)
    .delete(deleteExpense);

export default router;
