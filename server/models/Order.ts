import mongoose, { Schema } from "mongoose";
import { IOrder, IOrderItem } from "../types/index.js";

const generateOrderNumber = () => `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

const orderItemSchema = new Schema<IOrderItem>({
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    size: { type: String },
});

const orderSchema = new Schema<IOrder>({
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    orderNumber: { type: String, required: true, unique: true, default: generateOrderNumber },
    items: {
        type: [orderItemSchema],
        required: true,
        validate: [(items: IOrderItem[]) => items.length > 0, 'Order must have at least one item'],
    },
    shippingAddress: {
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        zipCode: { type: String, required: true },
        country: { type: String, required: true },
    },
    paymentMethod: { type: String, enum: ["cash", "stripe"], required: true },
    paymentStatus: { type: String, enum: ["pending", "paid", "failed", "refunded"], default: "pending" },
    paymentIntentId: { type: String },
    orderStatus: { type: String, enum: ["placed", "processing", "shipped", "delivered", "cancelled"], default: "placed" },
    subtotal: { type: Number, required: true, min: 0 },
    shippingCost: { type: Number, required: true, min: 0, default: 0 },
    tax: { type: Number, required: true, min: 0, default: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    notes: { type: String },
    deliveredAt: { type: Date },
}, { timestamps: true });

const Order = mongoose.model<IOrder>("Order", orderSchema);

export default Order;
