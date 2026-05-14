import { Request, Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { Device } from './Device.model';
import * as deviceService from './device.service';
import { deploymentService } from './deployment.service';
import { emitAuditLog, sanitizeAuditPayload, toPlainObject } from '../AuditLog/AuditLog.service';

export const createDevice = async (req: AuthRequest, res: Response) => {
  try {
    const device = await deviceService.createDevice(req.body);
    await emitAuditLog({
      workspaceId: req.body.organizationId || null,
      organizationId: req.body.organizationId || null,
      actorUserId: req.user?.userId,
      resourceType: 'device',
      resourceId: String(device._id),
      action: 'device.manufacture',
      after: device,
      reason: req.body.reason,
    });
    res.status(201).json(device);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Unable to create the device' });
  }
};

export const getDevices = async (req: Request, res: Response) => {
  const devices = await deviceService.getDevices(req.query);
  res.json(devices);
};

export const getDeviceById = async (req: Request, res: Response) => {
  const device = await deviceService.getDeviceById(req.params.id);
  if (!device) return res.status(404).json({ error: 'Device not found' });
  res.json(device);
};

export const getConfigByDeviceId = async (req: Request, res: Response) => {
  try {
    const config = await deviceService.getConfigByDeviceId(req.params.id);
    if (!config) return res.status(404).json({ error: 'Configuration not found for the Device' });
    res.json(config);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Unable to retrieve the Device configuration' });
  }
};

export const updateDevice = async (req: AuthRequest, res: Response) => {
  try {
    const before = await Device.findById(req.params.id).lean();
    const updated = await deviceService.updateDevice(req.params.id, req.body);
    const beforeOrgId = before?.organizationId ? String(before.organizationId) : null;
    const afterPlain = toPlainObject(updated);
    const afterOrgId = afterPlain?.organizationId?._id
      ? String(afterPlain.organizationId._id)
      : afterPlain?.organizationId
        ? String(afterPlain.organizationId)
        : null;
    const workspaceId = afterOrgId || beforeOrgId;

    if (!beforeOrgId && afterOrgId) {
      await emitAuditLog({
        workspaceId,
        organizationId: workspaceId,
        actorUserId: req.user?.userId,
        resourceType: 'device',
        resourceId: req.params.id,
        action: 'device.claim',
        before,
        after: updated,
        reason: req.body.reason,
      });
    } else if (beforeOrgId && afterOrgId && beforeOrgId !== afterOrgId) {
      await emitAuditLog({
        workspaceId: afterOrgId,
        organizationId: afterOrgId,
        actorUserId: req.user?.userId,
        resourceType: 'device',
        resourceId: req.params.id,
        action: 'device.transfer',
        before,
        after: updated,
        reason: req.body.reason,
      });
    }

    if (req.body.ports) {
      await emitAuditLog({
        workspaceId,
        organizationId: workspaceId,
        actorUserId: req.user?.userId,
        resourceType: 'device',
        resourceId: req.params.id,
        action: 'device.config.edit',
        before: before ? { ports: sanitizeAuditPayload(before.ports) } : null,
        after: { ports: sanitizeAuditPayload(afterPlain?.ports) },
        reason: req.body.reason,
      });
    } else {
      await emitAuditLog({
        workspaceId,
        organizationId: workspaceId,
        actorUserId: req.user?.userId,
        resourceType: 'device',
        resourceId: req.params.id,
        action: 'device.update',
        before,
        after: updated,
        reason: req.body.reason,
      });
    }

    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Unable to update the Device' });
  }
};

export const deleteDevice = async (req: Request, res: Response) => {
  try {
    await deviceService.deleteDevice(req.params.id);
    res.status(204).send();
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Unable to delete the Device' });
  }
};

// 🔹 Deployment endpoints
export const deployConfig = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const before = await Device.findById(id).select('deployment organizationId').lean();

    const result = await deploymentService.deployConfig(id);
    await emitAuditLog({
      workspaceId: before?.organizationId ? String(before.organizationId) : null,
      organizationId: before?.organizationId ? String(before.organizationId) : null,
      actorUserId: req.user?.userId,
      resourceType: 'device',
      resourceId: id,
      action: 'config.deployment',
      before: before?.deployment || null,
      after: result,
      reason: req.body.reason,
    });
    res.status(201).json({
      message: 'Config deployment initiated',
      deployment: result,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Unable to deploy config' });
  }
};

export const getDeploymentStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const status = await deploymentService.getDeploymentStatus(id);
    res.json(status);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Unable to fetch deployment status' });
  }
};

export const updateDeploymentStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const payload = req.body;
    const before = await Device.findById(id).select('deployment organizationId').lean();

    const result = await deploymentService.updateDeploymentStatus(id, payload);
    await emitAuditLog({
      workspaceId: before?.organizationId ? String(before.organizationId) : null,
      organizationId: before?.organizationId ? String(before.organizationId) : null,
      actorDeviceId: id,
      resourceType: 'device',
      resourceId: id,
      action: payload.status === 'error' ? 'deployment.failure' : 'deployment.acknowledgement',
      before: before?.deployment || null,
      after: result,
      reason: payload.message,
    });
    res.json({
      message: 'Deployment status updated',
      deployment: result,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Unable to update deployment status' });
  }
};

// export const getDeploymentHistory = async (req: Request, res: Response) => {
//   try {
//     const { id } = req.params;
//     const history = await deploymentService.getDeploymentHistory(id);
//     res.json(history);
//   } catch (err: any) {
//     res.status(400).json({ error: err.message || 'Unable to fetch deployment history' });
//   }
// };
