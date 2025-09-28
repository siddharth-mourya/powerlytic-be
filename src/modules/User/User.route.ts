// user.routes.ts
import { Router } from 'express';
import {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUsersInOrg,
  registerCompanyAdmin,
  registerOrganizationAndAdmin,
  registerOrgUser,
} from './User.controller';
import { authMiddleware, requireRole } from '../../middlewares/auth.middleware';

const router = Router();

router.get('/org/:orgID', authMiddleware, getUsersInOrg);
router.get('/', authMiddleware, requireRole('CompanyAdmin'), getUsers);
router.get('/:id', authMiddleware, getUserById);
router.put('/:id', authMiddleware, updateUser);
router.delete('/:id', authMiddleware, deleteUser);

// protected
router.post(
  '/register-company-admin',
  authMiddleware,
  requireRole('CompanyAdmin'),
  registerCompanyAdmin,
);

// CompanyAdmin registers organization+first OrgAdmin
router.post(
  '/register-organization',
  authMiddleware,
  requireRole('CompanyAdmin'),
  registerOrganizationAndAdmin,
);

// Org Admin or CompanyAdmin can create org users
router.post(
  '/register-org-user',
  authMiddleware,
  requireRole(['OrgAdmin', 'CompanyAdmin']),
  registerOrgUser,
);

export default router;
