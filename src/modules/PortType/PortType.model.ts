import mongoose, { Schema, Document } from "mongoose";

export type ValueFormat = "number" | "string" | "object";
export type PortCategory = "input" | "output";

export interface IPortType extends Document {
  name: string; // e.g. "Digital Input", "Energy Port"
  category: PortCategory;
  valueFormat: ValueFormat;
  // objectSchema is a mapping like { "phase1": "number", "phase2": "number" }
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
    objectSchema: { type: Schema.Types.Mixed },
    unit: { type: String },
    description: { type: String },
  },
  { timestamps: true }
);

export const PortType = mongoose.model<IPortType>("PortType", PortTypeSchema);
