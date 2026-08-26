import { Request, Response } from 'express';
import Address from '../models/Address.js';

const ADDRESS_FIELDS = ['type', 'street', 'city', 'state', 'zipCode', 'country'] as const;

// Clears isDefault on every other address belonging to the user
const clearOtherDefaults = async (userId: any, exceptId: any) => {
    await Address.updateMany({ user: userId, _id: { $ne: exceptId } }, { isDefault: false });
};

// Get all addresses for the current user, default first
// GET /api/addresses
export const getAddresses = async (req: Request, res: Response) => {
    try {
        const addresses = await Address.find({ user: req.user!._id }).sort({ isDefault: -1, createdAt: -1 });
        res.json({ success: true, data: addresses });
    }
    catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
}

// Get a single address by ID (owner only)
// GET /api/addresses/:id
export const getAddress = async (req: Request, res: Response) => {
    try {
        const address = await Address.findOne({ _id: req.params.id, user: req.user!._id });
        if (!address) {
            return res.status(404).json({ success: false, message: 'Address not found' });
        }
        res.json({ success: true, data: address });
    }
    catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
}

// Create a new address for the current user
// POST /api/addresses
export const createAddress = async (req: Request, res: Response) => {
    try {
        const existingCount = await Address.countDocuments({ user: req.user!._id });
        // A user's first address always becomes their default
        const isDefault = existingCount === 0 ? true : !!req.body.isDefault;

        const address = await Address.create({
            ...req.body,
            user: req.user!._id,
            isDefault,
        });

        if (isDefault) {
            await clearOtherDefaults(req.user!._id, address._id);
        }

        res.status(201).json({ success: true, data: address });
    }
    catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
}

// Update an address (owner only)
// PUT /api/addresses/:id
export const updateAddress = async (req: Request, res: Response) => {
    try {
        const address = await Address.findOne({ _id: req.params.id, user: req.user!._id });
        if (!address) {
            return res.status(404).json({ success: false, message: 'Address not found' });
        }

        for (const field of ADDRESS_FIELDS) {
            if (req.body[field] !== undefined) {
                (address as any)[field] = req.body[field];
            }
        }
        if (req.body.isDefault !== undefined) {
            address.isDefault = !!req.body.isDefault;
        }

        await address.save();

        if (address.isDefault) {
            await clearOtherDefaults(req.user!._id, address._id);
        }

        res.json({ success: true, data: address });
    }
    catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
}

// Delete an address (owner only); promotes the most recently added remaining address to default
// DELETE /api/addresses/:id
export const deleteAddress = async (req: Request, res: Response) => {
    try {
        const address = await Address.findOne({ _id: req.params.id, user: req.user!._id });
        if (!address) {
            return res.status(404).json({ success: false, message: 'Address not found' });
        }

        const wasDefault = address.isDefault;
        await address.deleteOne();

        if (wasDefault) {
            const nextAddress = await Address.findOne({ user: req.user!._id }).sort({ createdAt: -1 });
            if (nextAddress) {
                nextAddress.isDefault = true;
                await nextAddress.save();
            }
        }

        res.json({ success: true, message: 'Address deleted successfully' });
    }
    catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
}

// Set an address as the default (owner only)
// PUT /api/addresses/:id/default
export const setDefaultAddress = async (req: Request, res: Response) => {
    try {
        const address = await Address.findOne({ _id: req.params.id, user: req.user!._id });
        if (!address) {
            return res.status(404).json({ success: false, message: 'Address not found' });
        }

        address.isDefault = true;
        await address.save();
        await clearOtherDefaults(req.user!._id, address._id);

        res.json({ success: true, data: address });
    }
    catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
}
