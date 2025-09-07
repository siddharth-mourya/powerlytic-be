import { Router } from "express";
import { createOrganization, getOrganizations, getOrganizationById, updateOrganization, deleteOrganization } from "./Organization.controller";

const router = Router();

router.post("/", createOrganization);
router.get("/", getOrganizations);
router.get("/:id", getOrganizationById);
router.put("/:id", updateOrganization);
router.delete("/:id", deleteOrganization);

export default router;
