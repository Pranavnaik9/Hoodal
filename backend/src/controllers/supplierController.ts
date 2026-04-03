import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get all suppliers for a shop
export const getSuppliers = async (req: Request, res: Response) => {
    try {
        const authReq = req as AuthRequest;
        const shopId = authReq.user?.shopId;
        if (!shopId) return res.status(400).json({ error: "No shop associated with user" });

        const suppliers = await prisma.supplier.findMany({
            where: { shopId },
            include: {
                _count: {
                    select: { products: true, purchases: true }
                },
                purchases: {
                    select: {
                        totalAmount: true,
                        amountPaid: true
                    }
                },
                supplierPayments: {
                    select: {
                        amount: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const suppliersWithBalance = suppliers.map(s => {
            const totalPurchased = s.purchases.reduce((acc, p) => acc + p.totalAmount, 0);
            const totalPaid = s.supplierPayments.reduce((acc, p) => acc + p.amount, 0);
            
            // Balance = What we bought - What we actually paid (all payments are in supplierPayments)
            const balance = totalPurchased - totalPaid;
            
            // Remove the raw arrays from the response to keep it clean
            const { purchases, supplierPayments, ...rest } = s;
            return { ...rest, balance };
        });

        res.json(suppliersWithBalance);
    } catch (error) {
        console.error("getSuppliers error:", error);
        res.status(500).json({ error: "Failed to fetch suppliers" });
    }
};

// Get single supplier with purchases and payments details
export const getSupplierById = async (req: Request, res: Response) => {
    try {
        const authReq = req as AuthRequest;
        const shopId = authReq.user?.shopId;
        const { id } = req.params;

        const supplier = await prisma.supplier.findFirst({
            where: { id, shopId },
            include: {
                products: true,
                purchases: {
                    include: {
                        PurchaseItem: {
                            include: {
                                product: true
                            }
                        }
                    },
                    orderBy: { orderDate: 'desc' },
                    take: 20
                },
                supplierPayments: {
                    orderBy: { date: 'desc' },
                    take: 20
                }
            }
        });

        if (!supplier) return res.status(404).json({ error: "Supplier not found" });

        // Calculate total balance
        const purchasesResult = await prisma.purchase.aggregate({
            where: { supplierId: id },
            _sum: { totalAmount: true, amountPaid: true }
        });
        const paymentsResult = await prisma.supplierPayment.aggregate({
            where: { supplierId: id },
            _sum: { amount: true }
        });

        const totalPurchased = purchasesResult._sum.totalAmount || 0;
        const totalPaid = paymentsResult._sum.amount || 0;

        const balance = totalPurchased - totalPaid;

        res.json({ ...supplier, balance });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch supplier details" });
    }
};

// Create a new supplier
export const createSupplier = async (req: Request, res: Response) => {
    try {
        const authReq = req as AuthRequest;
        const shopId = authReq.user?.shopId;
        if (!shopId) return res.status(400).json({ error: "No shop associated with user" });

        const { name, contact, email, address, gst } = req.body;

        if (!name) return res.status(400).json({ error: "Supplier name is required" });

        const supplier = await prisma.supplier.create({
            data: {
                name,
                contact,
                email,
                address,
                gst,
                shopId
            }
        });

        res.status(201).json(supplier);
    } catch (error) {
        res.status(500).json({ error: "Failed to create supplier" });
    }
};

// Update supplier
export const updateSupplier = async (req: Request, res: Response) => {
    try {
        const authReq = req as AuthRequest;
        const shopId = authReq.user?.shopId;
        const { id } = req.params;
        const { name, contact, email, address, gst, isActive } = req.body;

        const supplier = await prisma.supplier.findFirst({
            where: { id, shopId }
        });

        if (!supplier) return res.status(404).json({ error: "Supplier not found" });

        const updatedSupplier = await prisma.supplier.update({
            where: { id },
            data: { name, contact, email, address, gst, isActive }
        });

        res.json(updatedSupplier);
    } catch (error) {
        res.status(500).json({ error: "Failed to update supplier" });
    }
};

// Delete supplier (soft delete recommended, but doing hard delete for simplicity if no relations exist)
export const deleteSupplier = async (req: Request, res: Response) => {
    try {
        const authReq = req as AuthRequest;
        const shopId = authReq.user?.shopId;
        const { id } = req.params;

        const supplier = await prisma.supplier.findFirst({
            where: { id, shopId },
            include: {
                _count: { select: { products: true, purchases: true } }
            }
        });

        if (!supplier) return res.status(404).json({ error: "Supplier not found" });

        if (supplier._count.products > 0 || supplier._count.purchases > 0) {
            // Soft delete
            const updatedSupplier = await prisma.supplier.update({
                where: { id },
                data: { isActive: false }
            });
            return res.json({ message: "Supplier deactivated because it is in use", updatedSupplier });
        }

        await prisma.supplier.delete({ where: { id } });
        res.json({ message: "Supplier removed successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete supplier" });
    }
};

// Add payment to supplier (standalone payment)
export const addSupplierPayment = async (req: Request, res: Response) => {
    try {
        const authReq = req as AuthRequest;
        const shopId = authReq.user?.shopId;
        const { id } = req.params;
        const { amount, paymentMode, referenceNo, date, purchaseId } = req.body;

        if (!shopId) return res.status(400).json({ error: "No shop associated with user" });

        if (!amount || !paymentMode) {
            return res.status(400).json({ error: "Amount and paymentMode are required" });
        }

        const supplier = await prisma.supplier.findFirst({
            where: { id, shopId }
        });

        if (!supplier) return res.status(404).json({ error: "Supplier not found" });

        const payment = await prisma.supplierPayment.create({
            data: {
                supplierId: id,
                shopId: shopId,
                purchaseId: purchaseId || null,
                amount: Number(amount),
                paymentMode,
                referenceNo: referenceNo || (purchaseId ? `Payment for Purchase ${purchaseId}` : "General Payment"),
                date: date ? new Date(date) : new Date()
            }
        });

        // If linked to a purchase, update the purchase as well
        if (purchaseId) {
            const purchase = await prisma.purchase.findFirst({ 
                where: { id: purchaseId, shopId } 
            });
            if (purchase) {
                const newAmountPaid = purchase.amountPaid + Number(amount);
                let newStatus = "PARTIAL";
                if (newAmountPaid >= purchase.totalAmount) newStatus = "PAID";
                else if (newAmountPaid <= 0) newStatus = "PENDING";

                await prisma.purchase.update({
                    where: { id: purchaseId },
                    data: {
                        amountPaid: newAmountPaid,
                        paymentStatus: newStatus
                    }
                });
            }
        }

        res.status(201).json(payment);
    } catch (error: any) {
        console.error("addSupplierPayment error:", error);
        res.status(500).json({ 
            error: "Failed to add supplier payment", 
            details: process.env.NODE_ENV === 'development' ? error.message : undefined 
        });
    }
};



