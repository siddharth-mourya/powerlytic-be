import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { getAuditLogs, getDeviceAuditLogs, getWorkspaceAuditLogs } from './AuditLog.controller';

const router = Router();

router.get('/audit-logs', authMiddleware, getAuditLogs);
router.get('/workspaces/:workspaceId/audit-logs', authMiddleware, getWorkspaceAuditLogs);
router.get('/devices/:deviceId/audit-logs', authMiddleware, getDeviceAuditLogs);

export default router;
