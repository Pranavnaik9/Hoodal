# HOODAL - E-Commerce Platform

A modern e-commerce platform with customer shopping features and shop owner inventory/order management.

## Features

### Customer Features
- ✅ User registration and login
- ✅ Browse products by category
- ✅ Shopping cart management
- ✅ Checkout with delivery details
- ✅ Order placement and tracking
- ✅ Order history and details
- ✅ Cancel pending orders
- 💳 Payment integration (COD only for MVP)

### Admin Features
- ✅ Admin login
- ✅ Product CRUD operations
- ✅ Category management
- ✅ Inventory tracking with stock management
- ✅ Order management dashboard
- ✅ Update order status
- ✅ View customer information

## Tech Stack

### Backend
- **Runtime:** Node.js 20
- **Framework:** Express.js + TypeScript
- **Database:** PostgreSQL + Prisma ORM
- **Authentication:** JWT + bcrypt
- **Validation:** Zod

### Frontend
- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **State:** Zustand + TanStack Query
- **Routing:** React Router v6
- **Forms:** React Hook Form + Zod

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
\`\`\`bash
cd backend
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Create environment file:
\`\`\`bash
cp .env.example .env
\`\`\`

4. Update `.env` with your PostgreSQL credentials:
\`\`\`
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/hoodal_db?schema=public"
JWT_SECRET=your_secret_key
\`\`\`

5. Generate Prisma client and run migrations:
\`\`\`bash
npx prisma generate
npx prisma migrate dev --name init
\`\`\`

6. Start development server:
\`\`\`bash
npm run dev
\`\`\`

Backend will run on `http://localhost:3000`

### Frontend Setup

1. Navigate to frontend directory:
\`\`\`bash
cd frontend
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Create environment file:
\`\`\`bash
cp .env.example .env
\`\`\`

4. Start development server:
\`\`\`bash
npm run dev
\`\`\`

Frontend will run on `http://localhost:5173`

## Project Structure

\`\`\`
hoodal/
├── backend/
│   ├── prisma/              # Database schema
│   ├── src/
│   │   ├── config/          # Configuration
│   │   ├── controllers/     # Route handlers
│   │   ├── middleware/      # Auth, error handling
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   └── validators/      # Input validation
│   └── uploads/             # File uploads
│
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── lib/             # Utilities, API client
│   │   ├── store/           # State management
│   │   └── types/           # TypeScript types
│   └── public/              # Static assets
└── README.md
\`\`\`

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout
- `GET /api/v1/auth/me` - Get current user

### Products
- `GET /api/v1/products` - List all products
- `GET /api/v1/products/:id` - Get product by ID
- `POST /api/v1/products` - Create product (Admin)
- `PUT /api/v1/products/:id` - Update product (Admin)
- `DELETE /api/v1/products/:id` - Delete product (Admin)

### Categories
- `GET /api/v1/categories` - List all categories
- `POST /api/v1/categories` - Create category (Admin)
- `PUT /api/v1/categories/:id` - Update category (Admin)
- `DELETE /api/v1/categories/:id` - Delete category (Admin)

### Cart
- `GET /api/v1/cart` - Get user's cart
- `POST /api/v1/cart` - Add item to cart
- `PUT /api/v1/cart/items/:id` - Update cart item quantity
- `DELETE /api/v1/cart/items/:id` - Remove item from cart
- `DELETE /api/v1/cart` - Clear cart

### Orders
- `POST /api/v1/orders` - Create order (Customer)
- `GET /api/v1/orders` - Get customer orders
- `GET /api/v1/orders/:id` - Get order details
- `PUT /api/v1/orders/:id/cancel` - Cancel order
- `GET /api/v1/orders/admin/all` - Get all orders (Admin)
- `PUT /api/v1/orders/admin/:id` - Update order status (Admin)

## Creating an Admin User

Currently, admin users must be created manually in the database. After running migrations:

1. Register a normal user through the UI
2. Connect to your PostgreSQL database
3. Update the user's role:

\`\`\`sql
UPDATE users SET role = 'ADMIN' WHERE email = 'admin@example.com';
\`\`\`

## Development Workflow

1. **Backend changes:** Code auto-reloads with nodemon
2. **Frontend changes:** Hot module replacement with Vite
3. **Database changes:** Create new Prisma migration
   \`\`\`bash
   npx prisma migrate dev --name migration_name
   \`\`\`

## Next Steps

MVP ✅ Complete:
- [x] Project setup
- [x] Database schema
- [x] Authentication system
- [x] Product management
- [x] Inventory tracking
- [x] Shopping cart
- [x] Checkout flow
- [x] Order management
- [x] Admin dashboard

Post-MVP Enhancements:
- [ ] Online payment integration (Razorpay/Stripe)
- [ ] Email/SMS notifications
- [ ] Order invoice generation (PDF)
- [ ] Advanced search and filtering
- [ ] Customer reviews and ratings

## License

MIT
