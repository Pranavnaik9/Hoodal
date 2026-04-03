const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        const users = await prisma.user.findMany({
            select: { id: true, email: true, role: true, shopId: true }
        });
        console.log('--- Users ---');
        console.log(JSON.stringify(users, null, 2));

        const shops = await prisma.shop.findMany({
            select: { id: true, name: true }
        });
        console.log('--- Shops ---');
        console.log(JSON.stringify(shops, null, 2));

        const products = await prisma.product.findMany({
            take: 10,
            select: { id: true, name: true, shopId: true }
        });
        console.log('--- Products (first 10) ---');
        console.log(JSON.stringify(products, null, 2));

    } catch (err) {
        console.error(err);
    } finally {
        await prisma.$disconnect();
    }
}

check();
