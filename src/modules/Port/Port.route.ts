import { Router } from "express";
import { createPort, getPorts, getPortById, updatePort, deletePort } from "./Port.controller";

const router = Router();

router.post("/", createPort);
router.get("/", getPorts);
router.get("/:id", getPortById);
router.put("/:id", updatePort);
router.delete("/:id", deletePort);

export default router;
