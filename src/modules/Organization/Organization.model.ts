import mongoose, { Schema, Document } from "mongoose";

export interface IOrganization extends Document {
    name: string;
    code: string; // short unique code for URL/integration
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
        code: { type: String, required: true, unique: true }, // e.g. TATA01
        address: { type: String },
        contactEmail: { type: String },
        contactPhone: { type: String },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

export const Organization = mongoose.model<IOrganization>(
    "Organization",
    OrganizationSchema
);
