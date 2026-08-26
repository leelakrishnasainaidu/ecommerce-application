import express from "express";
import { getAddresses, getAddress, createAddress, updateAddress, deleteAddress, setDefaultAddress } from "../controllers/addressController.js";
import { protect } from "../middleware/auth.js";

const addressRouter = express.Router();

// All address routes require an authenticated user
addressRouter.use(protect);

// Get all addresses for the current user
addressRouter.get('/', getAddresses);

// Get a single address
addressRouter.get('/:id', getAddress);

// Create a new address
addressRouter.post('/', createAddress);

// Update an address
addressRouter.put('/:id', updateAddress);

// Set an address as the default
addressRouter.put('/:id/default', setDefaultAddress);

// Delete an address
addressRouter.delete('/:id', deleteAddress);

export default addressRouter;
