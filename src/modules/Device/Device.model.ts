import { Schema, model, Document, Types } from "mongoose";
import { IOrganization } from "../Organization/Organization.model";
import { IDeviceModel } from "../DeviceModel/DeviceModel.model";

export interface IDevice extends Document {
    organizationId?: IOrganization["_id"];
    imei: string;
    name: string;
    deviceModelId: IDeviceModel["_id"]; // to differentiate device types with number of ports, capabilities etc.
    status: "online" | "offline" | "maintenance";
    location?: {
        lat: number;
        lng: number;
        address?: string;
    };
    metadata?: Record<string, any>;
    pointOfContact?: string; // e.g. email or phone number for device maintainer
    lastSeen?: Date;
    manufacturingYear: Date;
    createdAt: Date;
    updatedAt: Date;
}

const DeviceSchema = new Schema<IDevice>(
    {
        organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
        name: { type: String, required: true },
        imei: { type: String, unique: true, required: true },
        deviceModelId: { type: Schema.Types.ObjectId, ref: "DeviceModel", required: true },

        status: {
            type: String,
            enum: ["online", "offline", "maintenance"],
            default: "offline",
        },
        location: {
            lat: Number,
            lng: Number,
            address: String,
        },
        manufacturingYear: { type: Date },
        pointOfContact: { type: String },
        metadata: { type: Schema.Types.Mixed },
        lastSeen: { type: Date },
    },
    { timestamps: true }
);

export const Device = model<IDevice>("Device", DeviceSchema);
