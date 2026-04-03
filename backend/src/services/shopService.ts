import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { AppError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

export class ShopService {
    async getAllShops(includeInactive: boolean = true) {
        const where: any = {};
        // We now return all shops and let the UI handle the "Offline" badge
        // if (!includeInactive) {
        //     where.isActive = true;
        // }

        const shops = await prisma.shop.findMany({
            where,
            include: {
                owner: {
                    select: { id: true, email: true, firstName: true, lastName: true },
                },
                _count: {
                    select: { products: true, orders: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return shops;
    }

    async getShopById(id: string) {
        const shop = await prisma.shop.findUnique({
            where: { id },
            include: {
                owner: {
                    select: { id: true, email: true, firstName: true, lastName: true },
                },
                categories: {
                    select: { id: true, name: true, description: true },
                },
                _count: {
                    select: { products: true, orders: true },
                },
            },
        });

        if (!shop) {
            throw new AppError('Shop not found', 404);
        }

        return shop;
    }

    /**
     * Onboard a new shop: creates the shop + the shop admin user
     */
    async createShop(data: {
        name: string;
        description?: string;
        address?: string;
        phone?: string;
        adminEmail: string;
        adminPassword: string;
        adminFirstName: string;
        adminLastName: string;
    }) {
        // Check if admin email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: data.adminEmail },
        });
        if (existingUser) {
            throw new AppError('Admin email already in use', 400);
        }

        const passwordHash = await bcrypt.hash(data.adminPassword, 10);

        // Create shop and admin user in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // Create shop admin user first (without shopId)
            const adminUser = await tx.user.create({
                data: {
                    email: data.adminEmail,
                    passwordHash,
                    firstName: data.adminFirstName,
                    lastName: data.adminLastName,
                    role: 'SHOP_ADMIN',
                },
            });

            // Create shop with owner
            const shop = await tx.shop.create({
                data: {
                    name: data.name,
                    description: data.description,
                    address: data.address,
                    phone: data.phone,
                    ownerId: adminUser.id,
                },
            });

            // Link the user to the shop
            await tx.user.update({
                where: { id: adminUser.id },
                data: { shopId: shop.id },
            });

            return {
                shop,
                adminUser: {
                    id: adminUser.id,
                    email: adminUser.email,
                    firstName: adminUser.firstName,
                    lastName: adminUser.lastName,
                    role: adminUser.role,
                },
            };
        });

        return result;
    }

    async updateShop(id: string, data: {
        name?: string;
        description?: string;
        address?: string;
        phone?: string;
        imageUrl?: string;
        latitude?: number | null;
        longitude?: number | null;
    }) {
        const shop = await prisma.shop.findUnique({ where: { id } });
        if (!shop) {
            throw new AppError('Shop not found', 404);
        }

        const updated = await prisma.shop.update({
            where: { id },
            data,
            include: {
                owner: {
                    select: { id: true, email: true, firstName: true, lastName: true },
                },
            },
        });

        return updated;
    }

    async toggleShopStatus(id: string) {
        const shop = await prisma.shop.findUnique({ where: { id } });
        if (!shop) {
            throw new AppError('Shop not found', 404);
        }

        const updated = await prisma.shop.update({
            where: { id },
            data: { isActive: !shop.isActive },
        });

        return updated;
    }

    async getShopStats(shopId: string) {
        const [productCount, orderCount, totalRevenue, pendingOrders] = await Promise.all([
            prisma.product.count({ where: { shopId, isActive: true } }),
            prisma.order.count({ where: { shopId } }),
            prisma.order.aggregate({
                where: { shopId, status: { not: 'CANCELLED' } },
                _sum: { total: true },
            }),
            prisma.order.count({ where: { shopId, status: 'PENDING' } }),
        ]);

        return {
            productCount,
            orderCount,
            totalRevenue: totalRevenue._sum.total || 0,
            pendingOrders,
        };
    }

    async getDailySummary(shopId: string) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const [orders, purchasesResult, expensesResult] = await Promise.all([
            prisma.order.findMany({
                where: {
                    shopId,
                    status: { not: 'CANCELLED' },
                    createdAt: {
                        gte: today,
                        lt: tomorrow
                    }
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.purchase.aggregate({
                where: {
                    shopId,
                    orderDate: {
                        gte: today,
                        lt: tomorrow
                    }
                },
                _sum: { totalAmount: true, amountPaid: true }
            }),
            prisma.expense.aggregate({
                where: {
                    shopId,
                    date: {
                        gte: today,
                        lt: tomorrow
                    }
                },
                _sum: { amount: true }
            })
        ]);

        const totalSalesToday = orders.reduce((sum, order) => sum + order.total, 0);
        const totalPurchasesToday = purchasesResult._sum.totalAmount || 0;
        const totalExpensesToday = expensesResult._sum.amount || 0;

        return {
            today: new Date().toISOString(),
            totalSalesToday,
            totalPurchasesToday,
            totalExpensesToday,
            netBalance: totalSalesToday - (totalPurchasesToday + totalExpensesToday),
            recentOrders: orders.slice(0, 10), // Optional: preview top 10 today
            allOrdersToday: orders
        };
    }

    /**
     * GST Summary: sales GST collected, purchase GST (input credit), net liability
     */
    async getGSTSummary(shopId: string, startDate?: string, endDate?: string) {
        const dateFilter: any = {};
        if (startDate) dateFilter.gte = new Date(startDate);
        if (endDate) {
            const end = new Date(endDate);
            end.setDate(end.getDate() + 1);
            dateFilter.lt = end;
        }

        // Sales GST — from OrderItems of completed orders
        const salesOrders = await prisma.order.findMany({
            where: {
                shopId,
                status: { not: 'CANCELLED' },
                ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}),
            },
            include: {
                OrderItem: true,
            },
        });

        let salesGST = 0;
        const salesSlabs: Record<number, { taxableValue: number; gstAmount: number }> = {};
        for (const order of salesOrders) {
            for (const item of order.OrderItem) {
                const rate = item.gstRate || 0;
                const taxableValue = item.price * item.quantity;
                const gstAmt = item.gstAmount || (taxableValue * rate / 100);
                salesGST += gstAmt;
                if (!salesSlabs[rate]) salesSlabs[rate] = { taxableValue: 0, gstAmount: 0 };
                salesSlabs[rate].taxableValue += taxableValue;
                salesSlabs[rate].gstAmount += gstAmt;
            }
        }

        // Purchase GST — from PurchaseItems (using frozen rate/amount)
        const purchases = await prisma.purchase.findMany({
            where: {
                shopId,
                ...(Object.keys(dateFilter).length > 0 ? { orderDate: dateFilter } : {}),
            },
            include: {
                PurchaseItem: true,
            },
        });

        let purchaseGST = 0;
        const purchaseSlabs: Record<number, { taxableValue: number; gstAmount: number }> = {};
        for (const purchase of purchases) {
            for (const item of purchase.PurchaseItem) {
                const rate = item.gstRate || 0;
                const taxableValue = item.price * item.quantity;
                const gstAmt = item.gstAmount || (taxableValue * rate / 100);
                purchaseGST += gstAmt;
                if (!purchaseSlabs[rate]) purchaseSlabs[rate] = { taxableValue: 0, gstAmount: 0 };
                purchaseSlabs[rate].taxableValue += taxableValue;
                purchaseSlabs[rate].gstAmount += gstAmt;
            }
        }

        return {
            salesGST: Math.round(salesGST * 100) / 100,
            purchaseGST: Math.round(purchaseGST * 100) / 100,
            netLiability: Math.round((salesGST - purchaseGST) * 100) / 100,
            salesSlabs,
            purchaseSlabs,
            totalSalesValue: salesOrders.reduce((s, o) => s + o.total, 0),
            totalPurchaseValue: purchases.reduce((s, p) => s + p.totalAmount, 0),
        };
    }
}

export const shopService = new ShopService();
