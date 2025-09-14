import mongoose, { Schema, Document } from 'mongoose';
import { IOrganization } from '../Organization/Organization.model';
import { IDeviceModel } from '../DeviceModel/DeviceModel.model';

export interface IDevice extends Document {
    name: string;
    imei: string;
    deviceModelId: IDeviceModel['_id'];
    organizationId?: IOrganization['_id']; // optional until sold
    status?: 'online' | 'offline' | 'maintenance';
    location?: { lat?: number; lng?: number; address?: string };
    metadata?: Record<string, any>;
    pointOfContact?: string;
    alertEmails?: string[]; // recipients for device-level alerts
    alertPhones?: string[]; // recipients for device-level alerts
    assignedAt?: Date; // when organization assignment happened
    lastSeen?: Date;
    manufacturingYear?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const DeviceSchema = new Schema<IDevice>(
    {
        organizationId: { type: Schema.Types.ObjectId, ref: 'Organization' }, // allow null pre-sale
        name: { type: String, required: true },
        imei: { type: String, required: true, unique: true },
        deviceModelId: { type: Schema.Types.ObjectId, ref: 'DeviceModel', required: true },
        status: { type: String, enum: ['online', 'offline', 'maintenance'], default: 'offline' },
        location: { lat: Number, lng: Number, address: String },
        metadata: { type: Schema.Types.Mixed },
        pointOfContact: { type: String },
        alertEmails: [String],
        alertPhones: [String],
        assignedAt: { type: Date },
        lastSeen: { type: Date },
        manufacturingYear: { type: Date },
    },
    { timestamps: true },
);

DeviceSchema.index({ imei: 1 }, { unique: true });

export const Device = mongoose.model<IDevice>('Device', DeviceSchema);
