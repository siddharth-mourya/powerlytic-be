import { Schema, model, Document } from "mongoose";
import { IDevice } from "../Device/Device.model";
import { IPortType } from "../PortType/PortType.model";

export interface IPort extends Document {
  deviceId: IDevice["_id"];
  name: string;
  portNumber: number;
  portTypeId: IPortType["_id"];
  unit?: string;
  calibrationValue?: {
    scaling: number;
    offset: number;
  };
  status: "active" | "inactive";
  thresholds?: {
    min?: number;
    max?: number;
    message?: string;
  };
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const PortSchema = new Schema<IPort>(
  {
    deviceId: { type: Schema.Types.ObjectId, ref: "Device", required: true },
    name: { type: String, required: true },
    portNumber: { type: Number, required: true },
    portTypeId: { type: Schema.Types.ObjectId, ref: "PortType", required: true },
    unit: { type: String },
    calibrationValue: {
      scaling: { type: Number, default: 1 },
      offset: { type: Number, default: 0 },
    },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    thresholds: {
      min: Number,
      max: Number,
      message: String,
    },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export const Port = model<IPort>("Port", PortSchema);
