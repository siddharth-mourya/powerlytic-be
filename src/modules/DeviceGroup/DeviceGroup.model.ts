import mongoose, { Schema, Document } from "mongoose";
import { IDevice } from "../Device/Device.model";
import { IOrganization } from "../Organization/Organization.model";

export interface IDeviceGroup extends Document {
  organizationId: IOrganization["_id"];
  name: string;
  description?: string;
  deviceIds: IDevice["_id"][];
  createdAt: Date;
  updatedAt: Date;
}

const DeviceGroupSchema = new Schema<IDeviceGroup>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    name: { type: String, required: true },
    description: { type: String },
    deviceIds: [{ type: Schema.Types.ObjectId, ref: "Device" }],
  },
  { timestamps: true }
);

DeviceGroupSchema.index({ organizationId: 1, name: 1 }, { unique: true });

export const DeviceGroup = mongoose.model<IDeviceGroup>("DeviceGroup", DeviceGroupSchema);
