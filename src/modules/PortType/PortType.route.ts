import { Router } from "express";
import { createPortType, getPortTypes, getPortTypeById, updatePortType, deletePortType } from "./PortType.controller";

const router = Router();

router.post("/", createPortType);
router.get("/", getPortTypes);
router.get("/:id", getPortTypeById);
router.put("/:id", updatePortType);
router.delete("/:id", deletePortType);

export default router;
