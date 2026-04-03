import express from 'express';
import cors from 'cors';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/authRoutes';
import shopRoutes from './routes/shopRoutes';
import productRoutes from './routes/productRoutes';
import categoryRoutes from './routes/categoryRoutes';
import uploadRoutes from './routes/uploadRoutes';
import cartRoutes from './routes/cartRoutes';
import orderRoutes from './routes/orderRoutes';
import supplierRoutes from './routes/supplierRoutes';
import purchaseRoutes from './routes/purchaseRoutes';
import expenseRoutes from './routes/expenseRoutes';
import favoriteShopRoutes from './routes/favoriteShopRoutes';
import userAddressRoutes from './routes/userAddressRoutes';
import userPaymentMethodRoutes from './routes/userPaymentMethodRoutes';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(config.upload.path));

// Routes
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'HOODAL Server is running' });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/shops', shopRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/cart', cartRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/suppliers', supplierRoutes);
app.use('/api/v1/purchases', purchaseRoutes);
app.use('/api/v1/expenses', expenseRoutes);
app.use('/api/v1/favorites', favoriteShopRoutes);
app.use('/api/v1/user/addresses', userAddressRoutes);
app.use('/api/v1/user/payment-methods', userPaymentMethodRoutes);

// Error handling (must be last)
app.use(errorHandler);

// Start server
app.listen(config.port, () => {
    console.log(`🚀 HOODAL Server running on port ${config.port}`);
    console.log(`📝 Environment: ${config.nodeEnv}`);
});

export default app;

// Trigger nodemon restart
