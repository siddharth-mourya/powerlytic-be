import { Request, Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { Alert } from './Alert.model';
import { Device } from '../Device/Device.model';
import { emitAuditLog } from '../AuditLog/AuditLog.service';

// Create alert
export const createAlert = async (req: Request, res: Response) => {
  try {
    const alert = await Alert.create(req.body);
    res.status(201).json(alert);
  } catch (err) {
    res.status(400).json({ message: (err as Error).message });
  }
};

// Get all alerts with filters
export const getAlerts = async (req: Request, res: Response) => {
  try {
    const { deviceId, portId, start, end, page = 1, limit = 50 } = req.query;

    const filter: any = {};
    if (deviceId) filter.deviceId = deviceId;
    if (portId) filter.portId = portId;
    if (start || end) filter.triggeredAt = {};
    if (start) filter.triggeredAt.$gte = new Date(start as string);
    if (end) filter.triggeredAt.$lte = new Date(end as string);

    const alerts = await Alert.find(filter)
      .sort({ triggeredAt: -1 })
      .skip((+page - 1) * +limit)
      .limit(+limit);

    res.json(alerts);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
};

// Get alert by ID
export const getAlertById = async (req: Request, res: Response) => {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) return res.status(404).json({ message: 'Alert not found' });
    res.json(alert);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
};

// Update alert
export const updateAlert = async (req: AuthRequest, res: Response) => {
  try {
    const before = await Alert.findById(req.params.id).lean();
    const alert = await Alert.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!alert) return res.status(404).json({ message: 'Alert not found' });

    if (req.body.status === 'acknowledged' || req.body.status === 'resolved') {
      const device = await Device.findById(alert.deviceId).select('organizationId').lean();
      const workspaceId = device?.organizationId ? String(device.organizationId) : null;
      await emitAuditLog({
        workspaceId,
        organizationId: workspaceId,
        actorUserId: req.user?.userId,
        resourceType: 'alert',
        resourceId: req.params.id,
        action: req.body.status === 'acknowledged' ? 'alert.acknowledge' : 'alert.resolve',
        before,
        after: alert,
        reason: req.body.reason,
      });
    }

    res.json(alert);
  } catch (err) {
    res.status(400).json({ message: (err as Error).message });
  }
};

// Delete alert
export const deleteAlert = async (req: Request, res: Response) => {
  try {
    await Alert.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
};
