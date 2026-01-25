import { Router } from 'express';
import { authMiddleware, requireRole } from '../../middlewares/auth.middleware';
import { UserRoles } from '../../utils/constants/user';
import {
  createOrganization,
  getOrganizations,
  getOrganizationById,
  updateOrganization,
  deleteOrganization,
} from './Organization.controller';

const router = Router();

router.post('/', authMiddleware, createOrganization);
router.get('/', authMiddleware, getOrganizations);
router.get('/:id', authMiddleware, getOrganizationById);
router.put('/:id', authMiddleware, updateOrganization);
router.delete('/:id', authMiddleware, deleteOrganization);

export default router;
