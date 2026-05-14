import { Request, Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { Organization } from './Organization.model';
import { User } from '../User/User.model';
import { Device } from '../Device/Device.model';
import { emitAuditLog } from '../AuditLog/AuditLog.service';

// Create organization
export const createOrganization = async (req: AuthRequest, res: Response) => {
  try {
    const org = await Organization.create(req.body);
    await emitAuditLog({
      workspaceId: String(org._id),
      organizationId: String(org._id),
      actorUserId: req.user?.userId,
      resourceType: 'workspace',
      resourceId: String(org._id),
      action: 'workspace.create',
      after: org,
      reason: req.body.reason,
    });
    res.status(201).json(org);
  } catch (err) {
    res.status(400).json({ message: (err as Error).message });
  }
};

// List all organizations
export const getOrganizations = async (req: Request, res: Response) => {
  try {
    const orgs = await Organization.find();
    res.json(orgs);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
};

// Get organization by ID with users & devices
export const getOrganizationById = async (req: Request, res: Response) => {
  try {
    const org = await Organization.findById(req.params.id);
    if (!org) return res.status(404).json({ message: 'Organization not found' });

    const users = await User.find({ organization: org._id });
    const devices = await Device.find({ organizationId: org._id });

    res.json({ organization: org, users, devices });
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
};

// Update organization
export const updateOrganization = async (req: AuthRequest, res: Response) => {
  try {
    const before = await Organization.findById(req.params.id).lean();
    const org = await Organization.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!org) return res.status(404).json({ message: 'Organization not found' });
    await emitAuditLog({
      workspaceId: req.params.id,
      organizationId: req.params.id,
      actorUserId: req.user?.userId,
      resourceType: 'workspace',
      resourceId: req.params.id,
      action: 'workspace.update',
      before,
      after: org,
      reason: req.body.reason,
    });
    res.json(org);
  } catch (err) {
    res.status(400).json({ message: (err as Error).message });
  }
};

// Delete organization
export const deleteOrganization = async (req: AuthRequest, res: Response) => {
  try {
    const before = await Organization.findByIdAndDelete(req.params.id);
    await emitAuditLog({
      workspaceId: req.params.id,
      organizationId: req.params.id,
      actorUserId: req.user?.userId,
      resourceType: 'workspace',
      resourceId: req.params.id,
      action: 'workspace.delete',
      before,
      reason: req.body.reason,
    });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
};
