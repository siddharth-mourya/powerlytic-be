import mongoose, { Schema, Document } from "mongoose";
import { IDevice } from "../Device/Device.model";
import { IPort } from "../Port/Port.model";

export interface IAlert extends Document {
  deviceId: IDevice["_id"];
  portId: IPort["_id"];
  triggeredAt: Date;
  value: any;
  message: string;
  severity: "low" | "medium" | "high";
  status: "new" | "acknowledged" | "resolved";
  sentTo?: { emails?: string[]; phones?: string[] };
  createdAt: Date;
  updatedAt: Date;
}

const AlertSchema = new Schema<IAlert>(
  {
    deviceId: { type: Schema.Types.ObjectId, ref: "Device", required: true },
    portId: { type: Schema.Types.ObjectId, ref: "Port", required: true },
    triggeredAt: { type: Date, default: Date.now },
    value: { type: Schema.Types.Mixed },
    message: { type: String },
    severity: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    status: { type: String, enum: ["new", "acknowledged", "resolved"], default: "new" },
    sentTo: { emails: [String], phones: [String] },
  },
  { timestamps: true }
);

AlertSchema.index({ status: 1, triggeredAt: -1 });

export const Alert = mongoose.model<IAlert>("Alert", AlertSchema);
