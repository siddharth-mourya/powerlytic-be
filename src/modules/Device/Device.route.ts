import { Router } from 'express';
import {
  createDevice,
  getDevices,
  getDeviceById,
  updateDevice,
  deleteDevice,
} from './device.controller';
import { authMiddleware, requireRole } from '../../middlewares/auth.middleware';
import { UserRoles } from '../../utils/constants/user';

const router = Router();

router.post('/', authMiddleware, requireRole(UserRoles.CompanyAdmin), createDevice);
router.get('/', authMiddleware, getDevices);
router.get('/:id', authMiddleware, getDeviceById);
router.put('/:id', authMiddleware, requireRole(UserRoles.OrgAdmin), updateDevice);
router.delete('/:id', authMiddleware, deleteDevice);

export default router;
