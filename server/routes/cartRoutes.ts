import express from "express";
import { getCart, addToCart, updateCartItem, removeFromCart, clearCart } from "../controllers/cartController.js";
import { protect } from "../middleware/auth.js";

const cartRouter = express.Router();

// All cart routes require an authenticated user
cartRouter.use(protect);

// Get the current user's cart
cartRouter.get('/', getCart);

// Add an item to the cart
cartRouter.post('/', addToCart);

// Update an item's quantity
cartRouter.put('/:productId', updateCartItem);

// Remove a single item from the cart
cartRouter.delete('/:productId', removeFromCart);

// Empty the cart
cartRouter.delete('/', clearCart);

export default cartRouter;
