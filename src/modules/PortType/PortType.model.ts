import { Schema, model, Document } from "mongoose";

export interface IPortType extends Document {
  name: string; // e.g. "Digital Input", "Energy Port", "Relay Output"
  category: "input" | "output";
  valueFormat: "number" | "string" | "object";
  objectSchema?: Record<string, string>;
  unit?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PortTypeSchema = new Schema<IPortType>(
  {
    name: { type: String, required: true, unique: true },
    category: { type: String, enum: ["input", "output"], required: true },
    valueFormat: { type: String, enum: ["number", "string", "object"], required: true },
    objectSchema: { type: Schema.Types.Mixed }, // e.g. { phase1: "number", phase2: "number", phase3: "number" }
    unit: { type: String },
    description: { type: String },
  },
  { timestamps: true }
);

export const PortType = model<IPortType>("PortType", PortTypeSchema);
