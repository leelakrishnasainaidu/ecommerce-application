import { Request, Response } from 'express';
import Cart from '../models/Cart.js';
import Product from '../models/Products.js';

const CART_POPULATE = { path: 'items.product', select: 'name price images stock isActive sizes' };

const findItemIndex = (cart: any, productId: string, size: string | undefined) => {
    return cart.items.findIndex((item: any) => item.product.toString() === productId && (item.size || undefined) === size);
};

// Get the current user's cart (creating an empty one if it doesn't exist yet)
// GET /api/cart
export const getCart = async (req: Request, res: Response) => {
    try {
        let cart = await Cart.findOne({ user: req.user!._id }).populate(CART_POPULATE);
        if (!cart) {
            cart = await Cart.create({ user: req.user!._id, items: [] });
        }
        res.json({ success: true, data: cart });
    }
    catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
}

// Add a product to the cart, or increase its quantity if it's already present
// POST /api/cart
export const addToCart = async (req: Request, res: Response) => {
    try {
        const { productId, quantity = 1, size } = req.body;

        if (!productId || Number(quantity) < 1) {
            return res.status(400).json({ success: false, message: 'productId and a positive quantity are required' });
        }

        const product = await Product.findById(productId);
        if (!product || !product.isActive) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        if (product.sizes.length > 0 && !size) {
            return res.status(400).json({ success: false, message: 'Please select a size' });
        }

        let cart = await Cart.findOne({ user: req.user!._id });
        if (!cart) {
            cart = new Cart({ user: req.user!._id, items: [] });
        }

        const existingIndex = findItemIndex(cart, productId, size);
        const currentQuantity = existingIndex > -1 ? cart.items[existingIndex].quantity : 0;
        const requestedQuantity = currentQuantity + Number(quantity);

        if (requestedQuantity > product.stock) {
            return res.status(400).json({ success: false, message: `Only ${product.stock} item(s) in stock` });
        }

        if (existingIndex > -1) {
            cart.items[existingIndex].quantity = requestedQuantity;
        }
        else {
            cart.items.push({ product: product._id, quantity: Number(quantity), price: product.price, size } as any);
        }

        await cart.save();
        await cart.populate(CART_POPULATE);

        res.status(201).json({ success: true, data: cart });
    }
    catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
}

// Update the quantity of an item already in the cart
// PUT /api/cart/:productId
export const updateCartItem = async (req: Request, res: Response) => {
    try {
        const productId = String(req.params.productId);
        const { quantity } = req.body;
        const size = typeof req.query.size === 'string' ? req.query.size : undefined;

        if (quantity === undefined || Number(quantity) < 1) {
            return res.status(400).json({ success: false, message: 'A positive quantity is required' });
        }

        const cart = await Cart.findOne({ user: req.user!._id });
        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }

        const itemIndex = findItemIndex(cart, productId, size);
        if (itemIndex === -1) {
            return res.status(404).json({ success: false, message: 'Item not found in cart' });
        }

        const product = await Product.findById(productId);
        if (!product || !product.isActive) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        if (Number(quantity) > product.stock) {
            return res.status(400).json({ success: false, message: `Only ${product.stock} item(s) in stock` });
        }

        cart.items[itemIndex].quantity = Number(quantity);
        await cart.save();
        await cart.populate(CART_POPULATE);

        res.json({ success: true, data: cart });
    }
    catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
}

// Remove a single item from the cart
// DELETE /api/cart/:productId
export const removeFromCart = async (req: Request, res: Response) => {
    try {
        const productId = String(req.params.productId);
        const size = typeof req.query.size === 'string' ? req.query.size : undefined;

        const cart = await Cart.findOne({ user: req.user!._id });
        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }

        const itemIndex = findItemIndex(cart, productId, size);
        if (itemIndex === -1) {
            return res.status(404).json({ success: false, message: 'Item not found in cart' });
        }

        cart.items.splice(itemIndex, 1);
        await cart.save();
        await cart.populate(CART_POPULATE);

        res.json({ success: true, data: cart });
    }
    catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
}

// Empty the cart
// DELETE /api/cart
export const clearCart = async (req: Request, res: Response) => {
    try {
        const cart = await Cart.findOne({ user: req.user!._id });
        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }

        cart.items = [];
        await cart.save();

        res.json({ success: true, data: cart });
    }
    catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
}
