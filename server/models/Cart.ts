import mongoose, { Schema } from "mongoose";
import { ICart, ICartItem } from "../types/index.js";

const cartItemSchema = new Schema<ICartItem>({
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    price: { type: Number, required: true, min: 0 },
    size: { type: String },
});

const cartSchema = new Schema<ICart>({
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    items: [cartItemSchema],
    totalAmount: { type: Number, default: 0, min: 0 },
}, { timestamps: true });

cartSchema.methods.calculateTotal = function (this: ICart): number {
    this.totalAmount = this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    return this.totalAmount;
};

cartSchema.pre("save", function () {
    this.calculateTotal();
});

const Cart = mongoose.model<ICart>("Cart", cartSchema);

export default Cart;
