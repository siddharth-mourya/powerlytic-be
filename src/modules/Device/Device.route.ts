import { Router } from 'express';
import {
  createDevice,
  getDevices,
  getDeviceById,
  updateDevice,
  deleteDevice,
  getConfigByDeviceId,
  deployConfig,
  getDeploymentStatus,
  updateDeploymentStatus,
} from './device.controller';
import { authMiddleware, requireRole } from '../../middlewares/auth.middleware';
import { UserRoles } from '../../utils/constants/user';

const router = Router();

// Standard CRUD operations
router.post('/', authMiddleware, requireRole(UserRoles.CompanyAdmin), createDevice);
router.get('/', authMiddleware, getDevices);
router.get('/:id', authMiddleware, getDeviceById);
router.get('/:id/config', authMiddleware, getConfigByDeviceId);
router.put('/:id', authMiddleware, requireRole(UserRoles.CompanyAdmin), updateDevice);
router.delete('/:id', authMiddleware, requireRole(UserRoles.CompanyAdmin), deleteDevice);

// 🔹 Deployment endpoints
// Frontend initiates config deployment
router.post(
  '/:id/deploy',
  authMiddleware,
  requireRole([UserRoles.OrgAdmin, UserRoles.CompanyAdmin]),
  deployConfig,
);

// Frontend polls for deployment status
router.get('/:id/deployment-status', authMiddleware, getDeploymentStatus);

// Device updates deployment status after processing config
router.put('/:id/deployment-status', updateDeploymentStatus); // No auth - called by device

// Optional: Get deployment history
// router.get('/:id/deployment-history', authMiddleware, getDeploymentHistory);

export default router;
