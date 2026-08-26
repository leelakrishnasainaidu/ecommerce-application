import express from "express";
import { getDashboardStats, getUsers, getUser, updateUserRole, deleteUser } from "../controllers/adminController.js";
import { protect, isAdmin } from "../middleware/auth.js";

const adminRouter = express.Router();

// All admin routes require an authenticated admin user
adminRouter.use(protect, isAdmin);

// Dashboard summary stats
adminRouter.get('/dashboard', getDashboardStats);

// List all users
adminRouter.get('/users', getUsers);

// Get a single user
adminRouter.get('/users/:id', getUser);

// Promote/demote a user's role
adminRouter.put('/users/:id/role', updateUserRole);

// Delete a user
adminRouter.delete('/users/:id', deleteUser);

export default adminRouter;
