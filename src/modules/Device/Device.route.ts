import { Router } from 'express';
import {
  createDevice,
  getDevices,
  getDeviceById,
  updateDevice,
  deleteDevice,
  getConfigByDeviceId,
} from './device.controller';
import { authMiddleware, requireRole } from '../../middlewares/auth.middleware';
import { UserRoles } from '../../utils/constants/user';

const router = Router();

router.post('/', authMiddleware, requireRole(UserRoles.CompanyAdmin), createDevice);
router.get('/', authMiddleware, getDevices);
router.get('/:id', authMiddleware, getDeviceById);
router.get('/:id/config', authMiddleware, getConfigByDeviceId);
router.put('/:id', authMiddleware, requireRole(UserRoles.CompanyAdmin), updateDevice);
router.delete('/:id', authMiddleware, requireRole(UserRoles.CompanyAdmin), deleteDevice);

export default router;
