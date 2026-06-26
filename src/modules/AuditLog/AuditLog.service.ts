import mongoose from 'mongoose';
import { AuditLog, IAuditLog } from './AuditLog.model';
import { Device } from '../Device/Device.model';

export interface AuditActor {
  actorUserId?: string | null;
  actorDeviceId?: string | null;
}

export interface AuditInput extends AuditActor {
  workspaceId?: string | null;
  organizationId?: string | null;
  resourceType: string;
  resourceId: string;
  action: string;
  before?: unknown;
  after?: unknown;
  reason?: string;
}

export interface AuditQuery {
  workspaceId?: string;
  organizationId?: string;
  deviceId?: string;
  resourceType?: string;
  resourceId?: string;
  action?: string;
  actorUserId?: string;
  actorDeviceId?: string;
  start?: string;
  end?: string;
  page?: string | number;
  limit?: string | number;
}

const SENSITIVE_KEYS = new Set([
  'password',
  'refreshToken',
  'refreshTokens',
  'resetPasswordToken',
  'resetPasswordExpires',
]);

export const toPlainObject = (value: any): any => {
  if (!value) return value;
  if (typeof value.toObject === 'function') return value.toObject({ depopulate: false });
  return value;
};

export const sanitizeAuditPayload = (value: any): any => {
  if (value === undefined || value === null) return value;
  if (value instanceof Date) return value;
  if (Array.isArray(value)) return value.map((item) => sanitizeAuditPayload(item));
  if (typeof value === 'object') {
    const plain = toPlainObject(value);
    return Object.entries(plain).reduce<Record<string, any>>((acc, [key, item]) => {
      if (SENSITIVE_KEYS.has(key)) return acc;
      acc[key] = sanitizeAuditPayload(item);
      return acc;
    }, {});
  }
  return value;
};

const objectIdOrNull = (value?: string | null) => {
  if (!value) return null;
  return mongoose.Types.ObjectId.isValid(value) ? new mongoose.Types.ObjectId(value) : null;
};

export const emitAuditLog = async (input: AuditInput): Promise<IAuditLog | null> => {
  try {
    const workspaceId = input.workspaceId || input.organizationId || null;
    return await AuditLog.create({
      workspaceId: objectIdOrNull(workspaceId),
      organizationId: objectIdOrNull(input.organizationId || workspaceId),
      actorUserId: objectIdOrNull(input.actorUserId),
      actorDeviceId: objectIdOrNull(input.actorDeviceId),
      resourceType: input.resourceType,
      resourceId: String(input.resourceId),
      action: input.action,
      before: sanitizeAuditPayload(input.before),
      after: sanitizeAuditPayload(input.after),
      reason: input.reason || '',
    });
  } catch (error) {
    console.error('Failed to emit audit log', error);
    return null;
  }
};

export const getDeviceWorkspaceId = async (deviceId: string): Promise<string | null> => {
  const device = await Device.findById(deviceId).select('organizationId').lean();
  return device?.organizationId ? String(device.organizationId) : null;
};

export const queryAuditLogs = async (query: AuditQuery) => {
  const filter: any = {};

  if (query.workspaceId) filter.workspaceId = query.workspaceId;
  if (query.organizationId) filter.organizationId = query.organizationId;
  if (query.resourceType) filter.resourceType = query.resourceType;
  if (query.resourceId) filter.resourceId = query.resourceId;
  if (query.deviceId) {
    filter.resourceType = 'device';
    filter.resourceId = query.deviceId;
  }
  if (query.action) filter.action = query.action;
  if (query.actorUserId) filter.actorUserId = query.actorUserId;
  if (query.actorDeviceId) filter.actorDeviceId = query.actorDeviceId;
  if (query.start || query.end) {
    filter.createdAt = {};
    if (query.start) filter.createdAt.$gte = new Date(query.start);
    if (query.end) filter.createdAt.$lte = new Date(query.end);
  }

  const page = Math.max(Number(query.page || 1), 1);
  const limit = Math.min(Math.max(Number(query.limit || 50), 1), 200);
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    AuditLog.countDocuments(filter),
  ]);

  return { items, page, limit, total };
};
