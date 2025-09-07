// src/modules/value/value.model.ts
import mongoose, { Schema, model, Document } from "mongoose";
import { IOrganization } from "../Organization/Organization.model";
import { IDevice } from "../Device/Device.model";
import { IPort } from "../Port/Port.model";

export interface IValue extends Document {
  ts: Date;
  ingestTs: Date;
  metadata: {
    orgId: IOrganization["_id"];
    deviceId: IDevice["_id"];
    portId: IPort["_id"];
  };
  rawValue: number;
  calibratedValue: number;
  quality?: string;
  rawPayload?: Record<string, any>;
}

const ValueSchema = new Schema<IValue>(
  {
    ts: { type: Date, required: true },
    ingestTs: { type: Date, default: Date.now },
    metadata: {
      orgId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
      deviceId: { type: Schema.Types.ObjectId, ref: "Device", required: true },
      portId: { type: Schema.Types.ObjectId, ref: "Port", required: true },
    },
    rawValue: { type: Number, required: true },
    calibratedValue: { type: Number, required: true },
    quality: { type: String, enum: ["good", "bad", "uncertain"], default: "good" },
    rawPayload: { type: Schema.Types.Mixed },
  },
  { timestamps: false } // we already have ts + ingestTs
);

// When creating model, mark this as a time-series collection
export const Value = model<IValue>("Value", ValueSchema, "values");


// 👇 Ensure collection exists with time-series config
async function initValueCollection() {
  const collections = await mongoose.connection.db?.listCollections({ name: "values" }).toArray();
  if (collections?.length === 0) {
    await mongoose.connection.db?.createCollection("values", {
      timeseries: {
        timeField: "ts",
        metaField: "metadata",
        granularity: "seconds",
      },
    });
    console.log("⏳ Created time-series collection: values");
  }
}
initValueCollection().catch(console.error);

