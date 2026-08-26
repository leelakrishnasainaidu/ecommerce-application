import express from "express";
import { getProducts, getProduct, createProduct, updateProduct, deleteProduct } from "../controllers/productController.js";
import upload from "../middleware/upload.js";
import { isAdmin, protect } from "../middleware/auth.js";

const productRouter = express.Router();

// Get all products
productRouter.get('/', getProducts);

// Get a single product
productRouter.get('/:id', getProduct);

// Create product (Admin only)
productRouter.post('/', protect, isAdmin, upload.array('images', 5), createProduct);

// Update product (Admin only)
productRouter.put('/:id', protect, isAdmin, upload.array('images', 5), updateProduct);

// Delete product (Admin only)
productRouter.delete('/:id', protect, isAdmin, deleteProduct);

export default productRouter;
