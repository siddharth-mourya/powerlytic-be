import { Router } from 'express';
import {
  createDeviceModel,
  getDeviceModels,
  getDeviceModelById,
  updateDeviceModel,
  deleteDeviceModel,
} from './DeviceModel.controller';

const router = Router();

router.get('/', getDeviceModels);
router.get('/:id', getDeviceModelById);
router.post('/', createDeviceModel);
// router.put("/:id", updateDeviceModel);
router.delete('/:id', deleteDeviceModel);

export default router;
