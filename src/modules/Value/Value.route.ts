import { Router } from "express";
import { createValue, getValues, getValueById } from "./Value.controller";

const router = Router();

router.post("/", createValue);        // ingest telemetry
router.get("/", getValues);          // list with filters, pagination
router.get("/:id", getValueById);    // single value

export default router;
