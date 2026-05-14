import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { createAlert, getAlerts, getAlertById, updateAlert, deleteAlert } from './Alert.controller';

const router = Router();

router.post('/', createAlert);
router.get('/', getAlerts);
router.get('/:id', getAlertById);
router.put('/:id', authMiddleware, updateAlert);
router.delete('/:id', deleteAlert);

export default router;
