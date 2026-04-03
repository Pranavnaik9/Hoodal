import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get all expenses for a shop
export const getExpenses = async (req: Request, res: Response) => {
    try {
        const authReq = req as AuthRequest;
        const shopId = authReq.user?.shopId;
        if (!shopId) return res.status(400).json({ error: "No shop associated with user" });

        // Optional query params for filtering
        const { category, startDate, endDate } = req.query;

        let whereClause: any = { shopId };

        if (category) {
            whereClause.category = category as string;
        }

        if (startDate || endDate) {
            whereClause.date = {};
            if (startDate) whereClause.date.gte = new Date(startDate as string);
            if (endDate) whereClause.date.lte = new Date(endDate as string);
        }

        const expenses = await prisma.expense.findMany({
            where: whereClause,
            orderBy: { date: 'desc' }
        });

        res.json(expenses);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch expenses" });
    }
};

// Get single expense
export const getExpenseById = async (req: Request, res: Response) => {
    try {
        const authReq = req as AuthRequest;
        const shopId = authReq.user?.shopId;
        const { id } = req.params;

        const expense = await prisma.expense.findFirst({
            where: { id, shopId }
        });

        if (!expense) return res.status(404).json({ error: "Expense not found" });

        res.json(expense);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch expense details" });
    }
};

// Create a new expense
export const createExpense = async (req: Request, res: Response) => {
    try {
        const authReq = req as AuthRequest;
        const shopId = authReq.user?.shopId;
        if (!shopId) return res.status(400).json({ error: "No shop associated with user" });

        const { category, amount, paymentMode, referenceNo, date, description } = req.body;

        if (!category || !amount || !paymentMode) {
            return res.status(400).json({ error: "Category, amount, and paymentMode are required" });
        }

        const expense = await prisma.expense.create({
            data: {
                shopId,
                category,
                amount: Number(amount),
                paymentMode,
                referenceNo,
                date: date ? new Date(date) : new Date(),
                description
            }
        });

        res.status(201).json(expense);
    } catch (error) {
        res.status(500).json({ error: "Failed to create expense" });
    }
};

// Update expense
export const updateExpense = async (req: Request, res: Response) => {
    try {
        const authReq = req as AuthRequest;
        const shopId = authReq.user?.shopId;
        const { id } = req.params;
        const { category, amount, paymentMode, referenceNo, date, description } = req.body;

        const expense = await prisma.expense.findFirst({
            where: { id, shopId }
        });

        if (!expense) return res.status(404).json({ error: "Expense not found" });

        const updatedExpense = await prisma.expense.update({
            where: { id },
            data: {
                category: category || expense.category,
                amount: amount ? Number(amount) : expense.amount,
                paymentMode: paymentMode || expense.paymentMode,
                referenceNo: referenceNo !== undefined ? referenceNo : expense.referenceNo,
                date: date ? new Date(date) : expense.date,
                description: description !== undefined ? description : expense.description
            }
        });

        res.json(updatedExpense);
    } catch (error) {
        res.status(500).json({ error: "Failed to update expense" });
    }
};

// Delete expense
export const deleteExpense = async (req: Request, res: Response) => {
    try {
        const authReq = req as AuthRequest;
        const shopId = authReq.user?.shopId;
        const { id } = req.params;

        const expense = await prisma.expense.findFirst({
            where: { id, shopId }
        });

        if (!expense) return res.status(404).json({ error: "Expense not found" });

        await prisma.expense.delete({ where: { id } });

        res.json({ message: "Expense removed successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete expense" });
    }
};
