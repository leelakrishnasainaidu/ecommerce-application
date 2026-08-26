import { Request, Response, NextFunction } from 'express';
import { getAuth } from '@clerk/express';
import User from '../models/User.js';

// Requires a signed-in user; attaches the matching Mongo user to req.user
export const protect = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId } = getAuth(req);
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const user = await User.findOne({ clerkId: userId });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        req.user = user;
        next();
    }
    catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
}

// Must run after protect; restricts access to admin users
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Forbidden: Admins only' });
    }
    next();
}
