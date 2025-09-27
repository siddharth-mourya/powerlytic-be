import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

export interface AuthRequest extends Request {
  user?: { userId: string; role: string; orgId?: string };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const accessToken = req.cookies.accessToken ||
    (req.headers.authorization && req.headers.authorization.split(" ")[1]);
  if (!accessToken) return res.status(401).json({ error: 'Missing token' });

  try {
    const payload = jwt.verify(accessToken, JWT_SECRET) as any;
    req.user = {
      userId: payload.userId,
      role: payload.role,
      orgId: payload.orgId,
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// requireRole accepts either a single role or array of roles
export function requireRole(roleOrRoles: string | string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

    const allowed = Array.isArray(roleOrRoles) ? roleOrRoles : [roleOrRoles];
    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden - insufficient role' });
    }
    next();
  };
}

// requireSameOrg ensures the target resource belongs to user's org (helper)
export function requireSameOrg(resourceOrgIdGetter: (req: AuthRequest) => string | undefined) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    const resourceOrgId = resourceOrgIdGetter(req);
    if (!resourceOrgId) return res.status(400).json({ error: 'Resource missing orgId' });

    if (String(resourceOrgId) !== String(req.user.orgId) && req.user.role !== 'CompanyAdmin') {
      return res.status(403).json({ error: 'Forbidden - not same organization' });
    }
    next();
  };
}
