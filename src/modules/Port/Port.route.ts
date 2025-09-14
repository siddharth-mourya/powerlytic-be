import { Router } from 'express';
import { getPorts, getPortById, updatePort } from './Port.controller';

const router = Router();

// We don't allow creating or deleting ports directly for now beacuse it is created automatically when a device is created
// and deleted when a device is deleted

// router.post("/", createPort);
router.get('/', getPorts);
router.get('/:id', getPortById);
router.put('/:id', updatePort);
// router.delete("/:id", deletePort);

export default router;
