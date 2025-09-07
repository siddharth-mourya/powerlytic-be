import { Router } from "express";
import {
  createDeviceGroup,
  getDeviceGroups,
  getDeviceGroupById,
  updateDeviceGroup,
  deleteDeviceGroup,
} from "./DeviceGroup.controller";

const router = Router();

router.post("/", createDeviceGroup);
router.get("/", getDeviceGroups);
router.get("/:id", getDeviceGroupById);
router.put("/:id", updateDeviceGroup);
router.delete("/:id", deleteDeviceGroup);

export default router;
