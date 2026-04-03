import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get all purchases for a shop (with filters: dateFrom, dateTo, status, supplierId)
export const getPurchases = async (req: Request, res: Response) => {
    try {
        const authReq = req as AuthRequest;
        const shopId = authReq.user?.shopId;
        if (!shopId) return res.status(400).json({ error: "No shop associated with user" });

        const { dateFrom, dateTo, status, supplierId } = req.query;

        const where: any = { shopId };

        // Date range filter
        if (dateFrom || dateTo) {
            where.orderDate = {};
            if (dateFrom) where.orderDate.gte = new Date(dateFrom as string);
            if (dateTo) {
                const endDate = new Date(dateTo as string);
                endDate.setHours(23, 59, 59, 999);
                where.orderDate.lte = endDate;
            }
        }

        // Status filter
        if (status && status !== 'ALL') {
            where.paymentStatus = status as string;
        }

        // Supplier filter
        if (supplierId) {
            where.supplierId = supplierId as string;
        }

        const purchases = await prisma.purchase.findMany({
            where,
            include: {
                supplier: {
                    select: { name: true, contact: true }
                },
                PurchaseItem: {
                    include: {
                        product: { select: { name: true, imageUrl: true } }
                    }
                },
                _count: {
                    select: { PurchaseItem: true }
                }
            },
            orderBy: { orderDate: 'desc' }
        });

        res.json(purchases);
    } catch (error) {
        console.error("getPurchases error:", error);
        res.status(500).json({ error: "Failed to fetch purchases" });
    }
};

// Get single purchase details
export const getPurchaseById = async (req: Request, res: Response) => {
    try {
        const authReq = req as AuthRequest;
        const shopId = authReq.user?.shopId;
        const { id } = req.params;

        const purchase = await prisma.purchase.findFirst({
            where: { id, shopId },
            include: {
                supplier: true,
                PurchaseItem: {
                    include: {
                        product: { select: { name: true, imageUrl: true } }
                    }
                },
                supplierPayments: {
                    orderBy: { date: 'desc' }
                }
            }
        });

        if (!purchase) return res.status(404).json({ error: "Purchase not found" });

        res.json(purchase);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch purchase details" });
    }
};

// Create a new purchase and update inventory
export const createPurchase = async (req: Request, res: Response) => {
    try {
        const authReq = req as AuthRequest;
        const shopId = authReq.user?.shopId;
        if (!shopId) return res.status(400).json({ error: "No shop associated with user" });

        const { supplierId, items, amountPaid, orderDate, paymentMode } = req.body;
        // items should be [{ productId, quantity, price, unitType?, conversionFactor? }]

        if (!supplierId || !items || !items.length) {
            return res.status(400).json({ error: "Supplier ID and items are required" });
        }

        const purchase = await prisma.$transaction(async (tx: any) => {
            // Calculate total with GST from current product rates
            let calculatedTotalAmount = 0;
            const enrichedItems = [];

            for (const item of items) {
                const product = await tx.product.findUnique({ where: { id: item.productId } });
                const gstRate = product?.gstRate || 0;

                // Support unit conversion
                const unitType = item.unitType || 'PCS';
                const conversionFactor = item.conversionFactor || 1;
                const pcsQuantity = item.quantity * conversionFactor;

                const gstAmount = (item.quantity * item.price * gstRate) / 100;
                calculatedTotalAmount += (item.quantity * item.price) + gstAmount;

                enrichedItems.push({
                    ...item,
                    unitType,
                    conversionFactor,
                    pcsQuantity,
                    gstRate,
                    gstAmount,
                    stockQuantity: product?.stockQuantity || 0
                });
            }

            const totalAmount = Math.round(calculatedTotalAmount * 100) / 100;
            const paymentStatus = (amountPaid || 0) >= totalAmount ? "PAID" : (amountPaid || 0) > 0 ? "PARTIAL" : "PENDING";

            // Create Purchase record
            const newPurchase = await tx.purchase.create({
                data: {
                    supplierId,
                    shopId,
                    totalAmount,
                    amountPaid: amountPaid || 0,
                    paymentStatus,
                    orderDate: orderDate ? new Date(orderDate) : new Date(),
                }
            });

            // Create initial payment record if amountPaid > 0
            if (amountPaid > 0) {
                await tx.supplierPayment.create({
                    data: {
                        supplierId,
                        shopId,
                        purchaseId: newPurchase.id,
                        amount: Number(amountPaid),
                        paymentMode: paymentMode || "CASH",
                        date: orderDate ? new Date(orderDate) : new Date(),
                        referenceNo: `Initial payment for Purchase ${newPurchase.id}`
                    }
                });
            }

            // Create Purchase Items and update product inventory
            for (const item of enrichedItems) {
                await tx.purchaseItem.create({
                    data: {
                        purchaseId: newPurchase.id,
                        productId: item.productId,
                        quantity: item.quantity,
                        unitType: item.unitType,
                        conversionFactor: item.conversionFactor,
                        pcsQuantity: item.pcsQuantity,
                        price: item.price,
                        gstRate: item.gstRate,
                        gstAmount: item.gstAmount
                    }
                });

                const product = await tx.product.findUnique({ where: { id: item.productId } });
                if (product) {
                    // Use pcsQuantity for stock update (inventory always in pieces)
                    const updateData: any = {
                        stockQuantity: product.stockQuantity + item.pcsQuantity,
                        costPrice: item.price, // Auto-update cost price from latest purchase rate
                    };

                    // Auto-calculate new Selling Price/MRP if margin percent is set
                    if (product.marginPercent != null) {
                        const inclusiveCost = item.price + (item.price * (product.gstRate || 0) / 100);
                        const newPrice = inclusiveCost + (inclusiveCost * product.marginPercent / 100);
                        updateData.price = Math.round(newPrice * 100) / 100;
                    }

                    await tx.product.update({
                        where: { id: item.productId },
                        data: updateData
                    });

                    // Log stock history (using pcsQuantity for stock change)
                    await tx.stockHistory.create({
                        data: {
                            productId: item.productId,
                            changeType: "PURCHASE",
                            quantityChange: item.pcsQuantity,
                            previousQuantity: product.stockQuantity,
                            newQuantity: product.stockQuantity + item.pcsQuantity,
                            referenceType: "PURCHASE",
                            referenceId: newPurchase.id,
                            notes: `Purchased ${item.quantity} ${item.unitType} (${item.pcsQuantity} pcs) from supplier ${supplierId}`,
                            createdBy: authReq.user!.userId
                        }
                    });
                }
            }

            return newPurchase;
        });

        res.status(201).json(purchase);
    } catch (error) {
        console.error("Purchase creation error:", error);
        res.status(500).json({ error: "Failed to create purchase" });
    }
};

// Update purchase status (record a new payment/confirmation)
export const updatePurchasePayment = async (req: Request, res: Response) => {
    try {
        const authReq = req as AuthRequest;
        const shopId = authReq.user?.shopId;
        const { id } = req.params;
        const { amount, paymentMode, date, referenceNo } = req.body;

        const purchase = await prisma.purchase.findFirst({
            where: { id, shopId }
        });

        if (!purchase) return res.status(404).json({ error: "Purchase not found" });

        const newAmountPaid = purchase.amountPaid + Number(amount);
        let newStatus = "PARTIAL";
        if (newAmountPaid >= purchase.totalAmount) newStatus = "PAID";
        else if (newAmountPaid <= 0) newStatus = "PENDING";

        const result = await prisma.$transaction(async (tx) => {
            // 1. Create the payment record
            await tx.supplierPayment.create({
                data: {
                    supplierId: purchase.supplierId,
                    shopId: shopId!,
                    purchaseId: id,
                    amount: Number(amount),
                    paymentMode: paymentMode || "CASH",
                    date: date ? new Date(date) : new Date(),
                    referenceNo: referenceNo || `Payment for Purchase ${id}`
                }
            });

            // 2. Update the purchase
            return await tx.purchase.update({
                where: { id },
                data: {
                    amountPaid: newAmountPaid,
                    paymentStatus: newStatus
                }
            });
        });

        res.json(result);
    } catch (error) {
        console.error("Update purchase payment error:", error);
        res.status(500).json({ error: "Failed to update purchase payment" });
    }
};
