import { Router } from "express";
import {
  createAlert,
  getAlerts,
  getAlertById,
  updateAlert,
  deleteAlert,
} from "./Alert.controller";

const router = Router();

router.post("/", createAlert);
router.get("/", getAlerts);
router.get("/:id", getAlertById);
router.put("/:id", updateAlert);
router.delete("/:id", deleteAlert);

export default router;
