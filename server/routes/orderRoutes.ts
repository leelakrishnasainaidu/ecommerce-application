import express from "express";
import { createOrder, getMyOrders, getOrder, cancelOrder, getAllOrders, updateOrderStatus } from "../controllers/orderController.js";
import { protect, isAdmin } from "../middleware/auth.js";

const orderRouter = express.Router();

// All order routes require an authenticated user
orderRouter.use(protect);

// Create an order from the current user's cart
orderRouter.post('/', createOrder);

// Get the current user's orders
orderRouter.get('/', getMyOrders);

// Get all orders (Admin only)
orderRouter.get('/admin', isAdmin, getAllOrders);

// Get a single order (owner or admin)
orderRouter.get('/:id', getOrder);

// Cancel an order (owner only)
orderRouter.put('/:id/cancel', cancelOrder);

// Update order status (Admin only)
orderRouter.put('/:id/status', isAdmin, updateOrderStatus);

export default orderRouter;
