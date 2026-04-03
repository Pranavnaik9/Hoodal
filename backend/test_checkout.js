const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
    try {
        const products = await prisma.product.findMany({
            include: { shop: true }
        });

        const users = await prisma.user.findMany({
            where: { role: 'SHOP_ADMIN' }
        });

        console.log('--- Admin Users ---');
        users.forEach(u => {
            console.log(`User: ${u.email}, Role: ${u.role}, ShopId: ${u.shopId}`);
        });

        console.log('\n--- Products ---');
        products.forEach(p => {
            console.log(`Product: ${p.name}, ShopId: ${p.shopId}, ShopName: ${p.shop.name}`);

            const matchingUser = users.find(u => u.shopId === p.shopId);
            if (matchingUser) {
                console.log(`  MATCH FOUND with user ${matchingUser.email}`);
            } else {
                console.log(`  NO MATCHING SHOP_ADMIN FOUND for this product's shopId!`);
            }
        });

    } catch (err) {
        console.error(err);
    } finally {
        await prisma.$disconnect();
    }
}

test();
