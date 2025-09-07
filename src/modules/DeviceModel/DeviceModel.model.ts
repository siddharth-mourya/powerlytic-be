import mongoose, { Schema, Document, Types } from "mongoose";
import { IPortType } from "../PortType/PortType.model";

export interface IDeviceModel extends Document {
  name: string;
  description?: string;
  ports: {
    portTypeId: IPortType["_id"];
    count: number;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const DeviceModelSchema = new Schema<IDeviceModel>(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String },
    ports: [
      {
        portTypeId: { type: Schema.Types.ObjectId, ref: "PortType", required: true },
        count: { type: Number, required: true, min: 1 },
      },
    ],
  },
  { timestamps: true }
);

export const DeviceModel = mongoose.model<IDeviceModel>("DeviceModel", DeviceModelSchema);
