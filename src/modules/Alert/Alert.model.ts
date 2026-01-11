import mongoose, { Schema } from 'mongoose';

const AlertSchema = new Schema(
  {
    deviceId: { type: Schema.Types.ObjectId, ref: 'Device', required: true },
    // portId: { type: Schema.Types.ObjectId, ref: "Port", required: true },
    triggeredAt: { type: Date, default: Date.now },
    value: { type: Schema.Types.Mixed },
    message: { type: String },
    severity: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    status: { type: String, enum: ['new', 'acknowledged', 'resolved'], default: 'new' },
    sentTo: { emails: [String], phones: [String] },
  },
  { timestamps: true },
);

AlertSchema.index({ status: 1, triggeredAt: -1 });

export const Alert = mongoose.model('Alert', AlertSchema);
