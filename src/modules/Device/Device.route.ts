import { Router } from "express";
import {
  createDevice,
  getDevices,
  getDeviceById,
  updateDevice,
  deleteDevice
} from "./device.controller";

const router = Router();

router.post("/", createDevice);
router.get("/", getDevices);
router.get("/:id", getDeviceById);
router.put("/:id", updateDevice);
router.delete("/:id", deleteDevice);

export default router;
