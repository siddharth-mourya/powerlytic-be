import { Request, Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { User } from './User.model';
import { Organization } from '../Organization/Organization.model';
import { UserService } from './User.service';
import { emitAuditLog } from '../AuditLog/AuditLog.service';

const exludeFields = {
  '-password': 0,
  '-refreshTokens': 0,
  '-resetPasswordToken': 0,
  '-resetPasswordExpires': 0,
  '-__v': 0,
};

// Create user
export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    const org = await Organization.findById(req.body.organization);
    if (!org) return res.status(404).json({ message: 'Organization not found' });

    const user = await User.create(req.body);
    await emitAuditLog({
      workspaceId: String(org._id),
      organizationId: String(org._id),
      actorUserId: req.user?.userId,
      resourceType: 'membership',
      resourceId: String(user._id),
      action: 'membership.add',
      after: user,
      reason: req.body.reason,
    });
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ message: (err as Error).message });
  }
};

export const registerCompanyAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const user = await UserService.registerCompanyAdmin(req.body);
    res.status(201).json({ user });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

// Company admin registers an organization and initial OrgAdmin
export const registerOrganizationAndAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const { orgData, adminUser } = req.body;
    const result = await UserService.registerOrganizationAndAdmin({ orgData, adminUser });
    const orgId = result.organization?._id ? String(result.organization._id) : null;
    if (orgId) {
      await emitAuditLog({
        workspaceId: orgId,
        organizationId: orgId,
        actorUserId: req.user?.userId,
        resourceType: 'workspace',
        resourceId: orgId,
        action: 'workspace.create',
        after: result.organization,
        reason: req.body.reason,
      });
    }
    if (result.orgAdmin) {
      await emitAuditLog({
        workspaceId: orgId,
        organizationId: orgId,
        actorUserId: req.user?.userId,
        resourceType: 'membership',
        resourceId: String(result.orgAdmin._id),
        action: 'membership.add',
        after: result.orgAdmin,
        reason: req.body.reason,
      });
    }
    res.status(201).json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

// OrgAdmin (or CompanyAdmin) registers an org user
export const registerOrgUser = async (req: AuthRequest, res: Response) => {
  try {
    const user = await UserService.registerOrgUser(req.body);
    await emitAuditLog({
      workspaceId: req.body.organization,
      organizationId: req.body.organization,
      actorUserId: req.user?.userId,
      resourceType: 'membership',
      resourceId: String(user._id),
      action: 'membership.add',
      after: user,
      reason: req.body.reason,
    });
    res.status(201).json(user);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

// List users with optional org filter
export const getUsers = async (req: any, res: Response) => {
  try {
    if (req.user.role !== 'CompanyAdmin' && req.user.role !== 'OrgAdmin') {
      // only CompanyAdmin and OrgAdmin can list users
      return res.status(403).json({ message: 'Forbidden' });
    }
    if (req.user.role === 'OrgAdmin') {
      // OrgAdmin can see only users in their org
      const users = await User.find({ organization: req.user.orgId }, exludeFields).populate(
        'organization',
        '-__v',
      );
      return res.json(users);
    }
    // CompanyAdmin can see all users
    const users = await User.find({}, exludeFields).populate('organization');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
};

// List users with optional org filter
export const getUsersInOrg = async (req: Request, res: Response) => {
  try {
    const users = await User.find({ organization: req.params.orgID }).populate('organization');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
};

// Get user by ID
export const getUserById = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id).populate('organization');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
};

// Update user
export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const before = await User.findById(req.params.id).lean();
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate(
      'organization',
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    const workspaceId =
      req.body.organization || (before?.organization ? String(before.organization) : null);
    await emitAuditLog({
      workspaceId,
      organizationId: workspaceId,
      actorUserId: req.user?.userId,
      resourceType: 'membership',
      resourceId: req.params.id,
      action: 'membership.update',
      before,
      after: user,
      reason: req.body.reason,
    });
    res.json(user);
  } catch (err) {
    res.status(400).json({ message: (err as Error).message });
  }
};

// Delete user
export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const before = await User.findByIdAndDelete(req.params.id);
    const workspaceId = before?.organization ? String(before.organization) : null;
    await emitAuditLog({
      workspaceId,
      organizationId: workspaceId,
      actorUserId: req.user?.userId,
      resourceType: 'membership',
      resourceId: req.params.id,
      action: 'membership.remove',
      before,
      reason: req.body.reason,
    });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
};
