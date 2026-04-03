import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting HOODAL seed...');

    const hashedPassword = await bcrypt.hash('hoodal123', 10);
    const shopPassword = await bcrypt.hash('shop123', 10);
    const customerPassword = await bcrypt.hash('customer123', 10);

    // ──────────────────────────────────────────────────────────────
    // 1. HOODAL Admin
    // ──────────────────────────────────────────────────────────────
    const hoodalAdmin = await prisma.user.upsert({
        where: { email: 'admin@hoodal.com' },
        update: {},
        create: {
            email: 'admin@hoodal.com',
            passwordHash: hashedPassword,
            firstName: 'Hoodal',
            lastName: 'Admin',
            phone: '9999999999',
            role: 'HOODAL_ADMIN',
        },
    });
    console.log('✅ HOODAL Admin created:', hoodalAdmin.email);

    // ──────────────────────────────────────────────────────────────
    // 2. Customer
    // ──────────────────────────────────────────────────────────────
    const customer = await prisma.user.upsert({
        where: { email: 'customer@test.com' },
        update: {},
        create: {
            email: 'customer@test.com',
            passwordHash: customerPassword,
            firstName: 'Rahul',
            lastName: 'Sharma',
            phone: '9876543210',
            role: 'CUSTOMER',
        },
    });
    console.log('✅ Customer created:', customer.email);

    // ──────────────────────────────────────────────────────────────
    // 3. Shop 1: Fresh Mart
    // ──────────────────────────────────────────────────────────────
    const freshMartAdmin = await prisma.user.upsert({
        where: { email: 'admin@freshmart.com' },
        update: {},
        create: {
            email: 'admin@freshmart.com',
            passwordHash: shopPassword,
            firstName: 'Amit',
            lastName: 'Patel',
            phone: '9876500001',
            role: 'SHOP_ADMIN',
        },
    });

    const freshMart = await prisma.shop.create({
        data: {
            name: 'Fresh Mart',
            description: 'Your neighbourhood grocery & milk store. Fresh products delivered daily!',
            address: '45 MG Road, Andheri West, Mumbai 400058',
            phone: '022-26001234',
            ownerId: freshMartAdmin.id,
        },
    });

    await prisma.user.update({
        where: { id: freshMartAdmin.id },
        data: { shopId: freshMart.id },
    });
    console.log('✅ Shop created: Fresh Mart');

    // Fresh Mart Categories
    const fmCategories = await Promise.all([
        prisma.category.create({ data: { name: 'Milk', description: 'Fresh milk variants', shopId: freshMart.id } }),
        prisma.category.create({ data: { name: 'Dairy Products', description: 'Curd, paneer, butter, ghee', shopId: freshMart.id } }),
        prisma.category.create({ data: { name: 'Groceries', description: 'Rice, atta, dal, oils', shopId: freshMart.id } }),
        prisma.category.create({ data: { name: 'Beverages', description: 'Cold drinks, juices, lassi', shopId: freshMart.id } }),
        prisma.category.create({ data: { name: 'Snacks', description: 'Biscuits, chips, namkeen', shopId: freshMart.id } }),
    ]);

    const fmProducts = [
        { name: 'Full Cream Milk (1L)', price: 68, stock: 50, catIdx: 0 },
        { name: 'Toned Milk (1L)', price: 56, stock: 50, catIdx: 0 },
        { name: 'Buffalo Milk (1L)', price: 75, stock: 30, catIdx: 0 },
        { name: 'Cow Milk (500ml)', price: 35, stock: 40, catIdx: 0 },
        { name: 'Fresh Curd (500g)', price: 40, stock: 30, catIdx: 1 },
        { name: 'Paneer (200g)', price: 90, stock: 20, catIdx: 1 },
        { name: 'Amul Butter (100g)', price: 56, stock: 25, catIdx: 1 },
        { name: 'Ghee (500g)', price: 320, stock: 15, catIdx: 1 },
        { name: 'Cheese Slice (10 pcs)', price: 120, stock: 20, catIdx: 1 },
        { name: 'Basmati Rice (1kg)', price: 85, stock: 30, catIdx: 2 },
        { name: 'Atta (1kg)', price: 48, stock: 40, catIdx: 2 },
        { name: 'Toor Dal (500g)', price: 75, stock: 30, catIdx: 2 },
        { name: 'Sugar (1kg)', price: 45, stock: 35, catIdx: 2 },
        { name: 'Sunflower Oil (1L)', price: 145, stock: 25, catIdx: 2 },
        { name: 'Coca Cola (750ml)', price: 40, stock: 40, catIdx: 3 },
        { name: 'Frooti (600ml)', price: 30, stock: 45, catIdx: 3 },
        { name: 'Real Juice (1L)', price: 99, stock: 20, catIdx: 3 },
        { name: 'Lassi (250ml)', price: 30, stock: 25, catIdx: 3 },
        { name: 'Parle-G (250g)', price: 25, stock: 50, catIdx: 4 },
        { name: 'Good Day (75g)', price: 30, stock: 40, catIdx: 4 },
        { name: 'Lays Classic (52g)', price: 20, stock: 35, catIdx: 4 },
        { name: 'Haldiram Bhujia (200g)', price: 55, stock: 30, catIdx: 4 },
    ];

    for (const p of fmProducts) {
        await prisma.product.create({
            data: {
                name: p.name,
                description: `Fresh ${p.name} from Fresh Mart`,
                price: p.price,
                stockQuantity: p.stock,
                shopId: freshMart.id,
                categoryId: fmCategories[p.catIdx].id,
                isActive: true,
            },
        });
    }
    console.log(`✅ Created ${fmProducts.length} products for Fresh Mart`);

    // ──────────────────────────────────────────────────────────────
    // 4. Shop 2: Daily Needs
    // ──────────────────────────────────────────────────────────────
    const dailyNeedsAdmin = await prisma.user.upsert({
        where: { email: 'admin@dailyneeds.com' },
        update: {},
        create: {
            email: 'admin@dailyneeds.com',
            passwordHash: shopPassword,
            firstName: 'Priya',
            lastName: 'Desai',
            phone: '9876500002',
            role: 'SHOP_ADMIN',
        },
    });

    const dailyNeeds = await prisma.shop.create({
        data: {
            name: 'Daily Needs Store',
            description: 'One-stop shop for all your household essentials and personal care products.',
            address: '12 Station Road, Bandra East, Mumbai 400051',
            phone: '022-26005678',
            ownerId: dailyNeedsAdmin.id,
        },
    });

    await prisma.user.update({
        where: { id: dailyNeedsAdmin.id },
        data: { shopId: dailyNeeds.id },
    });
    console.log('✅ Shop created: Daily Needs Store');

    const dnCategories = await Promise.all([
        prisma.category.create({ data: { name: 'Cleaning', description: 'Detergents, soaps, cleaners', shopId: dailyNeeds.id } }),
        prisma.category.create({ data: { name: 'Personal Care', description: 'Shampoo, soap, toothpaste', shopId: dailyNeeds.id } }),
        prisma.category.create({ data: { name: 'Kitchen Essentials', description: 'Spices, masala, sauces', shopId: dailyNeeds.id } }),
        prisma.category.create({ data: { name: 'Stationery', description: 'Notebooks, pens, supplies', shopId: dailyNeeds.id } }),
    ]);

    const dnProducts = [
        { name: 'Surf Excel (1kg)', price: 195, stock: 25, catIdx: 0 },
        { name: 'Vim Bar (200g)', price: 22, stock: 40, catIdx: 0 },
        { name: 'Harpic (500ml)', price: 95, stock: 20, catIdx: 0 },
        { name: 'Colin Glass Cleaner (500ml)', price: 85, stock: 15, catIdx: 0 },
        { name: 'Dove Shampoo (340ml)', price: 230, stock: 20, catIdx: 1 },
        { name: 'Lux Soap (150g)', price: 55, stock: 35, catIdx: 1 },
        { name: 'Colgate Toothpaste (200g)', price: 99, stock: 30, catIdx: 1 },
        { name: 'Dettol Handwash (200ml)', price: 79, stock: 25, catIdx: 1 },
        { name: 'Nivea Body Lotion (200ml)', price: 195, stock: 18, catIdx: 1 },
        { name: 'MDH Garam Masala (100g)', price: 75, stock: 30, catIdx: 2 },
        { name: 'Everest Turmeric (100g)', price: 35, stock: 40, catIdx: 2 },
        { name: 'Maggi Sauce (500g)', price: 99, stock: 25, catIdx: 2 },
        { name: 'Saffola Oil (1L)', price: 179, stock: 20, catIdx: 2 },
        { name: 'Tata Salt (1kg)', price: 28, stock: 50, catIdx: 2 },
        { name: 'Classmate Notebook', price: 45, stock: 50, catIdx: 3 },
        { name: 'Reynolds Pen (5 pack)', price: 50, stock: 30, catIdx: 3 },
        { name: 'Fevicol (50g)', price: 25, stock: 35, catIdx: 3 },
    ];

    for (const p of dnProducts) {
        await prisma.product.create({
            data: {
                name: p.name,
                description: `Quality ${p.name} from Daily Needs`,
                price: p.price,
                stockQuantity: p.stock,
                shopId: dailyNeeds.id,
                categoryId: dnCategories[p.catIdx].id,
                isActive: true,
            },
        });
    }
    console.log(`✅ Created ${dnProducts.length} products for Daily Needs`);

    // ──────────────────────────────────────────────────────────────
    // 5. Shop 3: Green Basket
    // ──────────────────────────────────────────────────────────────
    const greenBasketAdmin = await prisma.user.upsert({
        where: { email: 'admin@greenbasket.com' },
        update: {},
        create: {
            email: 'admin@greenbasket.com',
            passwordHash: shopPassword,
            firstName: 'Suresh',
            lastName: 'Kumar',
            phone: '9876500003',
            role: 'SHOP_ADMIN',
        },
    });

    const greenBasket = await prisma.shop.create({
        data: {
            name: 'Green Basket',
            description: 'Farm-fresh fruits, vegetables & organic products. Straight from the farm to your table!',
            address: '78 Hill Road, Juhu, Mumbai 400049',
            phone: '022-26009012',
            ownerId: greenBasketAdmin.id,
        },
    });

    await prisma.user.update({
        where: { id: greenBasketAdmin.id },
        data: { shopId: greenBasket.id },
    });
    console.log('✅ Shop created: Green Basket');

    const gbCategories = await Promise.all([
        prisma.category.create({ data: { name: 'Fruits', description: 'Fresh seasonal fruits', shopId: greenBasket.id } }),
        prisma.category.create({ data: { name: 'Vegetables', description: 'Farm-fresh vegetables', shopId: greenBasket.id } }),
        prisma.category.create({ data: { name: 'Organic', description: 'Certified organic products', shopId: greenBasket.id } }),
        prisma.category.create({ data: { name: 'Dry Fruits', description: 'Premium quality dry fruits', shopId: greenBasket.id } }),
        prisma.category.create({ data: { name: 'Sweets', description: 'Traditional Indian mithai', shopId: greenBasket.id } }),
    ]);

    const gbProducts = [
        { name: 'Alphonso Mango (1kg)', price: 350, stock: 20, catIdx: 0 },
        { name: 'Apple (1kg)', price: 180, stock: 25, catIdx: 0 },
        { name: 'Banana (1 dozen)', price: 50, stock: 40, catIdx: 0 },
        { name: 'Grapes (500g)', price: 60, stock: 30, catIdx: 0 },
        { name: 'Pomegranate (1kg)', price: 160, stock: 20, catIdx: 0 },
        { name: 'Tomato (1kg)', price: 40, stock: 35, catIdx: 1 },
        { name: 'Potato (1kg)', price: 30, stock: 50, catIdx: 1 },
        { name: 'Onion (1kg)', price: 35, stock: 45, catIdx: 1 },
        { name: 'Capsicum (250g)', price: 25, stock: 30, catIdx: 1 },
        { name: 'Spinach (bunch)', price: 20, stock: 40, catIdx: 1 },
        { name: 'Organic Honey (500g)', price: 350, stock: 15, catIdx: 2 },
        { name: 'Organic Ghee (500g)', price: 450, stock: 12, catIdx: 2 },
        { name: 'Organic Jaggery (500g)', price: 95, stock: 20, catIdx: 2 },
        { name: 'Organic Brown Rice (1kg)', price: 120, stock: 18, catIdx: 2 },
        { name: 'Almonds (250g)', price: 280, stock: 20, catIdx: 3 },
        { name: 'Cashews (250g)', price: 320, stock: 18, catIdx: 3 },
        { name: 'Raisins (250g)', price: 95, stock: 25, catIdx: 3 },
        { name: 'Walnuts (250g)', price: 350, stock: 15, catIdx: 3 },
        { name: 'Gulab Jamun (500g)', price: 180, stock: 15, catIdx: 4 },
        { name: 'Kaju Katli (250g)', price: 280, stock: 10, catIdx: 4 },
        { name: 'Rasgulla (500g)', price: 160, stock: 15, catIdx: 4 },
    ];

    for (const p of gbProducts) {
        await prisma.product.create({
            data: {
                name: p.name,
                description: `Premium ${p.name} from Green Basket`,
                price: p.price,
                stockQuantity: p.stock,
                shopId: greenBasket.id,
                categoryId: gbCategories[p.catIdx].id,
                isActive: true,
            },
        });
    }
    console.log(`✅ Created ${gbProducts.length} products for Green Basket`);

    // ──────────────────────────────────────────────────────────────
    // Summary
    // ──────────────────────────────────────────────────────────────
    console.log('');
    console.log('🎉 Seed completed successfully!');
    console.log('');
    console.log('╔══════════════════════════════════════════════════════╗');
    console.log('║                  LOGIN CREDENTIALS                  ║');
    console.log('╠══════════════════════════════════════════════════════╣');
    console.log('║  HOODAL Admin                                      ║');
    console.log('║    Email: admin@hoodal.com                         ║');
    console.log('║    Password: hoodal123                             ║');
    console.log('╠══════════════════════════════════════════════════════╣');
    console.log('║  Fresh Mart (Shop Admin)                           ║');
    console.log('║    Email: admin@freshmart.com                      ║');
    console.log('║    Password: shop123                               ║');
    console.log('╠══════════════════════════════════════════════════════╣');
    console.log('║  Daily Needs Store (Shop Admin)                    ║');
    console.log('║    Email: admin@dailyneeds.com                     ║');
    console.log('║    Password: shop123                               ║');
    console.log('╠══════════════════════════════════════════════════════╣');
    console.log('║  Green Basket (Shop Admin)                         ║');
    console.log('║    Email: admin@greenbasket.com                    ║');
    console.log('║    Password: shop123                               ║');
    console.log('╠══════════════════════════════════════════════════════╣');
    console.log('║  Customer                                          ║');
    console.log('║    Email: customer@test.com                        ║');
    console.log('║    Password: customer123                           ║');
    console.log('╚══════════════════════════════════════════════════════╝');
    console.log('');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
