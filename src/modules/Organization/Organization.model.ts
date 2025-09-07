import mongoose, { Schema, Document } from "mongoose";

export interface IOrganization extends Document {
    name: string;
    code: string;
    address?: string;
    contactEmail?: string;
    contactPhone?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const OrganizationSchema = new Schema<IOrganization>(
    {
        name: { type: String, required: true, unique: true },
        code: { type: String, required: true, unique: true },
        address: { type: String },
        contactEmail: { type: String },
        contactPhone: { type: String },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

export const Organization = mongoose.model<IOrganization>("Organization", OrganizationSchema);