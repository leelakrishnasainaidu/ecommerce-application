import dns from 'node:dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);

import "dotenv/config";
import express, { Request, Response } from 'express';
import cors from "cors";
import connectDB from './config/db.js';
import { clerkMiddleware } from "@clerk/express";
import { ClerkWebhook } from './controllers/webhooks.js';
import makeAdmin from './scripts/makeAdmin.js';
import productRouter from './routes/productsRoutes.js';
import cartRouter from './routes/cartRoutes.js';
import orderRouter from './routes/orderRoutes.js';
import addressRouter from './routes/addressRoutes.js';
import adminRouter from './routes/adminRoutes.js';

const app = express();

// Connect to MongoDB
await connectDB();

app.post('/api/clerk', express.raw({ type: 'application/json' }), ClerkWebhook)

// Middleware
app.use(cors())
app.use(express.json());
app.use(clerkMiddleware());

const port = process.env.PORT || 3000;

app.get('/', (req: Request, res: Response) => {
    res.send('Server is Live!');
});

app.use('/api/products', productRouter);
app.use('/api/cart', cartRouter);
app.use('/api/orders', orderRouter);
app.use('/api/addresses', addressRouter);
app.use('/api/admin', adminRouter);

await makeAdmin();

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});