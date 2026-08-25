import mongoose from "mongoose";
import { IUser } from "../types/index.js";

const UserSchema = new mongoose.Schema<IUser>(
    {
        name: { type: String, trim: true },
        email: { type: String, trim: true, unique: true },
        clerkId: { type: String, unique: true, sparse: true },
        image: { type: String },
        role: { type: String, enum: ["user", "admin"], default: "user" },
    },
    {
        timestamps: true,
    }
)

const User = mongoose.model<IUser>("User", UserSchema);

export default User;