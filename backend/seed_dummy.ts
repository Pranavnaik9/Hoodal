import { PrismaClient } from '@prisma/client';
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log("Seeding dummy data...");
    
    // 1. Create User and Shop
    const passwordHash = await bcrypt.hash('password123', 10);
    let user = await prisma.user.findFirst({ where: { email: 'admin@hoodal.com' }});
    
    let shop;
    if (!user) {
        user = await prisma.user.create({
            data: {
                firstName: 'Admin',
                lastName: 'User',
                email: 'admin@hoodal.com',
                passwordHash,
                role: 'HOODAL_ADMIN',
            }
        });
        
        shop = await prisma.shop.create({
            data: {
                name: 'Hoodal Supermart',
                address: '123 Main St',
                phone: '555-0100',
                ownerId: user.id
            }
        });
        
        await prisma.user.update({
            where: { id: user.id },
            data: { shopId: shop.id }
        });
    } else {
        shop = await prisma.shop.findFirst({ where: { ownerId: user.id }});
    }

    if (!shop) throw new Error("Shop not found");

    // 2. Create Categories
    const catSnacks = await prisma.category.create({ data: { name: 'Snacks', shopId: shop.id }});
    const catDrinks = await prisma.category.create({ data: { name: 'Beverages', shopId: shop.id }});

    // 3. Create Suppliers (this will test if adding a supplier fails)
    try {
        const sup1 = await prisma.supplier.create({
            data: { name: 'Wholesale Co.', contact: '9876543210', email: 'contact@wholesale.com', shopId: shop.id }
        });
        const sup2 = await prisma.supplier.create({
            data: { name: 'Fresh Distributors', contact: '9998887776', shopId: shop.id }
        });
        console.log("Suppliers created successfully");

        // 4. Create Products
        const prod1 = await prisma.product.create({
            data: { name: 'Lays Classic', categoryId: catSnacks.id, shopId: shop.id, supplierId: sup1.id, price: 20, costPrice: 15, gstRate: 12, stockQuantity: 100 }
        });
        const prod2 = await prisma.product.create({
            data: { name: 'Coca Cola 500ml', categoryId: catDrinks.id, shopId: shop.id, supplierId: sup2.id, price: 40, costPrice: 30, gstRate: 18, stockQuantity: 200 }
        });
        console.log("Products created successfully");

        // 5. Create Purchases
        const purch1 = await prisma.purchase.create({
            data: {
                supplierId: sup1.id,
                shopId: shop.id,
                totalAmount: 1680,
                amountPaid: 1000,
                paymentStatus: 'PARTIAL',
                orderDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
            }
        });
        await prisma.purchaseItem.create({
            data: {
                purchaseId: purch1.id, productId: prod1.id, quantity: 1, unitType: 'BOX', conversionFactor: 100, pcsQuantity: 100, price: 15, gstRate: 12, gstAmount: 180
            }
        });
        await prisma.supplierPayment.create({
            data: {
                supplierId: sup1.id, shopId: shop.id, purchaseId: purch1.id, amount: 1000, paymentMode: 'BANK_TRANSFER', referenceNo: 'TXN123456', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
            }
        });

        const purch2 = await prisma.purchase.create({
            data: {
                supplierId: sup2.id,
                shopId: shop.id,
                totalAmount: 7080,
                amountPaid: 7080,
                paymentStatus: 'PAID',
                orderDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Yesterday
            }
        });
        await prisma.purchaseItem.create({
            data: {
                purchaseId: purch2.id, productId: prod2.id, quantity: 10, unitType: 'OUTER', conversionFactor: 20, pcsQuantity: 200, price: 30 * 20, gstRate: 18, gstAmount: 1080
            }
        });
        await prisma.supplierPayment.create({
            data: {
                supplierId: sup2.id, shopId: shop.id, purchaseId: purch2.id, amount: 7080, paymentMode: 'UPI', referenceNo: 'UPI987654', date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
            }
        });

        console.log("Purchases & Payments seeded successfully");

    } catch (e) {
        console.error("Error creating dummy data:", e);
    }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
