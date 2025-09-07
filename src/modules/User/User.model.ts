import mongoose, { Schema, Document } from "mongoose";
import { IOrganization } from "../Organization/Organization.model";

export type UserRole = "CompanyAdmin" | "OrgAdmin" | "User";

export interface IUser extends Document {
    email: string;
    password: string; // hashed
    name: string;
    role: UserRole;
    organization: IOrganization["_id"];
    phone?: string;
    isActive: boolean;
    lastLogin?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
    {
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        name: { type: String, required: true },
        phone: { type: String },
        role: {
            type: String,
            enum: ["CompanyAdmin", "OrgAdmin", "User"],
            default: "User",
        },
        organization: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
        isActive: { type: Boolean, default: true },
        lastLogin: { type: Date },
    },
    { timestamps: true }
);

export const User = mongoose.model<IUser>("User", UserSchema);
