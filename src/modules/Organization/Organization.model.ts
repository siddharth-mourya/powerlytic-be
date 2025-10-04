import mongoose, { Schema, Document } from 'mongoose';

export interface IOrganization extends Document {
  name: string;
  address: string;
  orgEmail: string;
  orgPhone: string;
  isActive?: boolean;
  cin?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationSchema = new Schema<IOrganization>(
  {
    name: { type: String, required: true },
    address: { type: String, required: true },
    orgEmail: { type: String, required: true, unique: true },
    orgPhone: { type: String, required: true, unique: true },
    isActive: { type: Boolean, default: true },
    cin: { type: String },
  },
  { timestamps: true },
);

export const Organization = mongoose.model<IOrganization>('Organization', OrganizationSchema);
