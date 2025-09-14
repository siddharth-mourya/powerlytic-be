import { Router } from 'express';
import {
  createPortType,
  getPortTypes,
  getPortTypeById,
  updatePortType,
  deletePortType,
} from './PortType.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

const router = Router();

router.post('/', authMiddleware, createPortType);
router.get('/', authMiddleware, getPortTypes);
router.get('/:id', authMiddleware, getPortTypeById);
router.put('/:id', authMiddleware, updatePortType);
router.delete('/:id', authMiddleware, deletePortType);

export default router;
