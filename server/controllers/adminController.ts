import { Request, Response } from 'express';
import User from '../models/User.js';
import Product from '../models/Products.js';
import Order from '../models/Order.js';

// Get summary stats for the admin dashboard
// GET /api/admin/dashboard
export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        const [totalUsers, totalProducts, totalOrders, revenueResult, ordersByStatus, recentOrders] = await Promise.all([
            User.countDocuments(),
            Product.countDocuments(),
            Order.countDocuments(),
            Order.aggregate([
                { $match: { paymentStatus: 'paid' } },
                { $group: { _id: null, total: { $sum: '$totalAmount' } } },
            ]),
            Order.aggregate([
                { $group: { _id: '$orderStatus', count: { $sum: 1 } } },
            ]),
            Order.find().sort({ createdAt: -1 }).limit(5).populate('user', 'name email'),
        ]);

        const ordersByStatusMap = ordersByStatus.reduce((acc: Record<string, number>, item: any) => {
            acc[item._id] = item.count;
            return acc;
        }, {});

        res.json({
            success: true,
            data: {
                totalUsers,
                totalProducts,
                totalOrders,
                totalRevenue: revenueResult[0]?.total || 0,
                ordersByStatus: ordersByStatusMap,
                recentOrders,
            },
        });
    }
    catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
}

// Get all users (Admin only)
// GET /api/admin/users
export const getUsers = async (req: Request, res: Response) => {
    try {
        const { page = 1, limit = 10, search } = req.query;
        const query: any = {};
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }

        const total = await User.countDocuments(query);
        const users = await User.find(query)
            .sort({ createdAt: -1 })
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit));

        res.json({ success: true, data: users, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
    }
    catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
}

// Get a single user by ID (Admin only)
// GET /api/admin/users/:id
export const getUser = async (req: Request, res: Response) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.json({ success: true, data: user });
    }
    catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
}

// Promote or demote a user's role (Admin only)
// PUT /api/admin/users/:id/role
export const updateUserRole = async (req: Request, res: Response) => {
    try {
        const { role } = req.body;
        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({ success: false, message: 'Invalid role' });
        }
        if (req.params.id === req.user!._id.toString()) {
            return res.status(400).json({ success: false, message: 'You cannot change your own role' });
        }

        const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, data: user });
    }
    catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
}

// Delete a user (Admin only)
// DELETE /api/admin/users/:id
export const deleteUser = async (req: Request, res: Response) => {
    try {
        if (req.params.id === req.user!._id.toString()) {
            return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        await user.deleteOne();
        res.json({ success: true, message: 'User deleted successfully' });
    }
    catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
}
