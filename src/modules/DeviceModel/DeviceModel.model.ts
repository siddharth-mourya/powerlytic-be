import { Schema, model, Document, Types } from "mongoose";
import { IPortType } from "../PortType/PortType.model";

export interface IDeviceModel extends Document {
  name: string; // e.g., "EnergyMeter-100", "RelayController-5x"
  description?: string;
  ports: {
    portTypeId: IPortType["_id"]; // reference to PortType
    count: number; // how many ports of this type
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
        count: { type: Number, required: true },
      },
    ],
  },
  { timestamps: true }
);

export const DeviceModel = model<IDeviceModel>("DeviceModel", DeviceModelSchema);
