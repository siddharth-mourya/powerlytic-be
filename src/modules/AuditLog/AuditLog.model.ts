import mongoose, { Document, Schema } from 'mongoose';

export interface IAuditLog extends Document {
  workspaceId?: mongoose.Types.ObjectId | null;
  organizationId?: mongoose.Types.ObjectId | null;
  actorUserId?: mongoose.Types.ObjectId | null;
  actorDeviceId?: mongoose.Types.ObjectId | null;
  resourceType: string;
  resourceId: string;
  action: string;
  before?: unknown;
  after?: unknown;
  reason?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Organization', default: null, index: true },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      default: null,
      index: true,
    },
    actorUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    actorDeviceId: { type: Schema.Types.ObjectId, ref: 'Device', default: null, index: true },
    resourceType: { type: String, required: true, index: true },
    resourceId: { type: String, required: true, index: true },
    action: { type: String, required: true, index: true },
    before: { type: Schema.Types.Mixed, default: null },
    after: { type: Schema.Types.Mixed, default: null },
    reason: { type: String, default: '' },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

AuditLogSchema.index({ workspaceId: 1, createdAt: -1 });
AuditLogSchema.index({ organizationId: 1, createdAt: -1 });
AuditLogSchema.index({ resourceType: 1, resourceId: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
