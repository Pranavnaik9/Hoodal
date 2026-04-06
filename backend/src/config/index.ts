import dotenv from 'dotenv';
dotenv.config();

export const config = {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    database: {
        url: process.env.DATABASE_URL || '',
    },
    jwt: {
        secret: (process.env.JWT_SECRET || 'your_secret_key') as string,
        expiry: process.env.JWT_EXPIRY || '7d',
    },
    upload: {
        path: process.env.UPLOAD_PATH || '/tmp/uploads',
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5MB
    },
};
