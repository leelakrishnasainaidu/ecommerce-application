import { Request, Response } from 'express';
import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Product from '../models/Products.js';

// Placeholder business rules — no shipping/tax provider is wired up yet
const SHIPPING_COST = 50;
const FREE_SHIPPING_THRESHOLD = 999;
const TAX_RATE = 0.05;

const CANCELLABLE_STATUSES = ['placed', 'processing'];
const VALID_ORDER_STATUSES = ['placed', 'processing', 'shipped', 'delivered', 'cancelled'];

// Create an order from the current user's cart
// POST /api/orders
export const createOrder = async (req: Request, res: Response) => {
    try {
        const { shippingAddress, paymentMethod, notes } = req.body;

        if (!shippingAddress || !paymentMethod) {
            return res.status(400).json({ success: false, message: 'shippingAddress and paymentMethod are required' });
        }

        const cart = await Cart.findOne({ user: req.user!._id });
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ success: false, message: 'Cart is empty' });
        }

        const orderItems = [];
        for (const cartItem of cart.items) {
            const product = await Product.findById(cartItem.product);
            if (!product || !product.isActive) {
                return res.status(404).json({ success: false, message: 'One or more products are no longer available' });
            }
            if (product.stock < cartItem.quantity) {
                return res.status(400).json({ success: false, message: `Only ${product.stock} item(s) of ${product.name} in stock` });
            }
            orderItems.push({
                product: product._id,
                name: product.name,
                quantity: cartItem.quantity,
                price: product.price,
                size: cartItem.size,
            });
        }

        const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
        const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
        const totalAmount = subtotal + shippingCost + tax;

        const order = await Order.create({
            user: req.user!._id,
            items: orderItems,
            shippingAddress,
            paymentMethod,
            subtotal,
            shippingCost,
            tax,
            totalAmount,
            notes,
        });

        // Reduce stock only after the order is successfully created
        await Promise.all(orderItems.map((item) => Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } })));

        cart.items = [];
        await cart.save();

        res.status(201).json({ success: true, data: order });
    }
    catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
}

// Get the current user's orders
// GET /api/orders
export const getMyOrders = async (req: Request, res: Response) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const query = { user: req.user!._id };

        const total = await Order.countDocuments(query);
        const orders = await Order.find(query)
            .sort({ createdAt: -1 })
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit));

        res.json({ success: true, data: orders, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
    }
    catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
}

// Get a single order — accessible to its owner or an admin
// GET /api/orders/:id
export const getOrder = async (req: Request, res: Response) => {
    try {
        const order = await Order.findById(req.params.id).populate('items.product', 'name images');
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        if (order.user.toString() !== req.user!._id.toString() && req.user!.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }
        res.json({ success: true, data: order });
    }
    catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
}

// Cancel an order while it's still placed/processing, and restock its items
// PUT /api/orders/:id/cancel
export const cancelOrder = async (req: Request, res: Response) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        if (order.user.toString() !== req.user!._id.toString()) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }
        if (!CANCELLABLE_STATUSES.includes(order.orderStatus)) {
            return res.status(400).json({ success: false, message: `Order cannot be cancelled once it is ${order.orderStatus}` });
        }

        order.orderStatus = 'cancelled';
        if (order.paymentStatus === 'paid') {
            order.paymentStatus = 'refunded';
        }
        await order.save();

        await Promise.all(order.items.map((item) => Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } })));

        res.json({ success: true, data: order });
    }
    catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
}

// Get all orders across all users (Admin only)
// GET /api/orders/admin
export const getAllOrders = async (req: Request, res: Response) => {
    try {
        const { page = 1, limit = 10, status } = req.query;
        const query: any = {};
        if (status) {
            query.orderStatus = status;
        }

        const total = await Order.countDocuments(query);
        const orders = await Order.find(query)
            .populate('user', 'name email')
            .sort({ createdAt: -1 })
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit));

        res.json({ success: true, data: orders, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
    }
    catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
}

// Update an order's status (Admin only)
// PUT /api/orders/:id/status
export const updateOrderStatus = async (req: Request, res: Response) => {
    try {
        const { orderStatus } = req.body;
        if (!VALID_ORDER_STATUSES.includes(orderStatus)) {
            return res.status(400).json({ success: false, message: 'Invalid order status' });
        }

        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        order.orderStatus = orderStatus;
        if (orderStatus === 'delivered') {
            order.deliveredAt = new Date();
            if (order.paymentMethod === 'cash') {
                order.paymentStatus = 'paid';
            }
        }
        await order.save();

        res.json({ success: true, data: order });
    }
    catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
}
