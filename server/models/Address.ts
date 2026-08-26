import mongoose, { Schema } from "mongoose";
import { IAddress } from "../types/index.js";

const addressSchema = new Schema<IAddress>({
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["Home", "Work", "Other"], default: "Home" },
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    zipCode: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    isDefault: { type: Boolean, default: false },
}, { timestamps: true });

addressSchema.index({ user: 1 });

const Address = mongoose.model<IAddress>("Address", addressSchema);

export default Address;
