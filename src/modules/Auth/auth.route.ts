import { Router } from "express";
import { AuthController } from "./auth.controller";
import { authMiddleware, requireRole } from "../../middlewares/auth.middleware";

const router = Router();

// public
router.post("/login", AuthController.login);
router.post("/refresh", AuthController.refresh);
router.post("/request-reset", AuthController.requestPasswordReset);
router.post("/reset-password", AuthController.resetPassword);

// protected
router.post("/register-company-admin", authMiddleware, requireRole("CompanyAdmin"), AuthController.registerCompanyAdmin);
// CompanyAdmin registers organization+first OrgAdmin
router.post("/register-organization", authMiddleware, requireRole("CompanyAdmin"), AuthController.registerOrganizationAndAdmin);

// Org Admin or CompanyAdmin can create org users
router.post("/register-org-user", authMiddleware, requireRole("OrgAdmin"), AuthController.registerOrgUser);

// profile
router.get("/me", authMiddleware, AuthController.me);

// logout - revoke refresh token
router.post("/logout", AuthController.logout);

export default router;
