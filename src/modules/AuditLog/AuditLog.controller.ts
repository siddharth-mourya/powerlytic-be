import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { getDeviceWorkspaceId, queryAuditLogs } from './AuditLog.service';

type WorkspaceScope =
  | { ok: true; workspaceId?: string }
  | { ok: false; status: number; error: string };

const ensureWorkspaceScope = (
  req: AuthRequest,
  requestedWorkspaceId?: string | null,
): WorkspaceScope => {
  if (!req.user) return { ok: false, status: 401, error: 'Not authenticated' };

  if (req.user.role === 'CompanyAdmin') {
    return { ok: true, workspaceId: requestedWorkspaceId || undefined };
  }

  if (!req.user.orgId) {
    return { ok: false, status: 403, error: 'User is not assigned to a workspace' };
  }

  if (requestedWorkspaceId && String(requestedWorkspaceId) !== String(req.user.orgId)) {
    return { ok: false, status: 403, error: 'Forbidden - not same workspace' };
  }

  return { ok: true, workspaceId: req.user.orgId };
};

export const getAuditLogs = async (req: AuthRequest, res: Response) => {
  try {
    const requestedWorkspaceId = (req.query.workspaceId || req.query.organizationId) as
      | string
      | undefined;
    const scope = ensureWorkspaceScope(req, requestedWorkspaceId);
    if (!scope.ok) return res.status(scope.status).json({ error: scope.error });

    const result = await queryAuditLogs({
      ...req.query,
      workspaceId: scope.workspaceId,
      organizationId: scope.workspaceId,
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
};

export const getWorkspaceAuditLogs = async (req: AuthRequest, res: Response) => {
  try {
    const scope = ensureWorkspaceScope(req, req.params.workspaceId);
    if (!scope.ok) return res.status(scope.status).json({ error: scope.error });

    const result = await queryAuditLogs({
      ...req.query,
      workspaceId: req.params.workspaceId,
      organizationId: req.params.workspaceId,
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
};

export const getDeviceAuditLogs = async (req: AuthRequest, res: Response) => {
  try {
    const workspaceId = await getDeviceWorkspaceId(req.params.deviceId);
    if (!workspaceId) return res.status(404).json({ error: 'Device not found or unassigned' });

    const scope = ensureWorkspaceScope(req, workspaceId);
    if (!scope.ok) return res.status(scope.status).json({ error: scope.error });

    const result = await queryAuditLogs({
      ...req.query,
      workspaceId,
      organizationId: workspaceId,
      deviceId: req.params.deviceId,
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
};
