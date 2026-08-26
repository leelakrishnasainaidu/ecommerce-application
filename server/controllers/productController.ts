import { Request, Response } from 'express';
import Product from '../models/Products.js';
import cloudinary from '../config/cloudinary.js';

const uploadImages = (files: Express.Multer.File[]): Promise<string[]> => {
    const uploadPromises = files.map((file) => {
        return new Promise<string>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream({ folder: 'ecom-app/products' }, (error, result) => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve(result!.secure_url);
                }
            });
            uploadStream.end(file.buffer);
        });
    });
    return Promise.all(uploadPromises);
};

const normalizeSizes = (sizes: any): string[] => {
    if (typeof sizes === 'string') {
        try {
            sizes = JSON.parse(sizes);
        }
        catch (e) {
            sizes = sizes.split(',').map((s: string) => s.trim()).filter((s: string) => s !== '');
        }
    }
    return Array.isArray(sizes) ? sizes : [sizes];
};

const deleteImages = async (imageUrls: string[]): Promise<void> => {
    const deletePromises = imageUrls.map((imageUrl) => {
        const publicIdMatch = imageUrl.match(/\/v\d+\/(.+)\.[a-z]+$/);
        const publicId = publicIdMatch ? publicIdMatch[1] : null;
        return publicId ? cloudinary.uploader.destroy(publicId) : Promise.resolve();
    });
    await Promise.all(deletePromises);
};

// Fields updatable via PUT /api/products/:id — images and sizes are handled separately
const UPDATABLE_FIELDS = ['name', 'description', 'price', 'category', 'stock', 'isFeatured', 'isActive'] as const;

// Get all Products
// GET /api/products
export const getProducts = async (req: Request, res: Response) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const query: any = { isActive: true };

        const total = await Product.countDocuments(query);
        const products = await Product.find(query).skip((Number(page) - 1) * Number(limit)).limit(Number(limit));

        res.json({ success: true, data: products, pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
    }
    catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
}

// Get a single Product by ID
// GET /api/products/:id
export const getProduct = async (req: Request, res: Response) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        res.json({ success: true, data: product });
    }
    catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
}

// Create a new Product
// POST /api/products
export const createProduct = async (req: Request, res: Response) => {
    try {
        const files = (req.files as Express.Multer.File[]) || [];
        const images = files.length > 0 ? await uploadImages(files) : [];

        if (images.length === 0) {
            return res.status(400).json({ success: false, message: 'Please upload at least one image' });
        }

        const productData = {
            ...req.body,
            images,
            sizes: normalizeSizes(req.body.sizes || [])
        };

        const product = await Product.create(productData);
        res.status(201).json({ success: true, data: product });
    }
    catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
}

// Update a Product by ID
// PUT /api/products/:id
export const updateProduct = async (req: Request, res: Response) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // Images the client wants to keep; defaults to all current images
        let existingImages = product.images;
        if (req.body.existingImages !== undefined) {
            try {
                existingImages = JSON.parse(req.body.existingImages);
            }
            catch (e) {
                existingImages = Array.isArray(req.body.existingImages) ? req.body.existingImages : [req.body.existingImages];
            }
        }

        const removedImages = product.images.filter((image) => !existingImages.includes(image));

        const files = (req.files as Express.Multer.File[]) || [];
        const newImages = files.length > 0 ? await uploadImages(files) : [];

        const updates: any = {};
        for (const field of UPDATABLE_FIELDS) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }
        if (req.body.sizes !== undefined) {
            updates.sizes = normalizeSizes(req.body.sizes);
        }
        updates.images = [...existingImages, ...newImages];

        Object.assign(product, updates);
        await product.save();

        // Only clean up removed images from Cloudinary once the update has actually persisted
        if (removedImages.length > 0) {
            deleteImages(removedImages).catch((error) => console.error('Failed to delete removed product images from Cloudinary:', error));
        }

        res.json({ success: true, data: product });
    }
    catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
}

// Delete a Product by ID
// DELETE /api/products/:id
export const deleteProduct = async (req: Request, res: Response) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // Delete images from Cloudinary
        if (product.images && product.images.length > 0) {
            await deleteImages(product.images);
        }

        await product.deleteOne();
        res.json({ success: true, message: 'Product deleted successfully' });
    }
    catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
}
