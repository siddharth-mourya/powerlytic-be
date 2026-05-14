import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { User } from '../User/User.model';
import { emitAuditLog } from '../AuditLog/AuditLog.service';

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password required' });
    }
    const { accessToken, refreshToken, user } = await AuthService.login(email, password);

    res.json({ user, accessToken, refreshToken });
  } catch (err: any) {
    res.status(401).json({ error: err.message });
  }
};

export class AuthController {
  static async refresh(req: Request, res: Response) {
    try {
      const { userId, refreshToken } = req.body;
      if (!userId || !refreshToken)
        return res.status(400).json({ error: 'userId and refreshToken required' });

      const {
        accessToken,
        refreshToken: newRefreshToken,
        user,
      } = await AuthService.refresh(userId, refreshToken);

      await emitAuditLog({
        workspaceId: user.organization ? String(user.organization) : null,
        organizationId: user.organization ? String(user.organization) : null,
        actorUserId: String(user._id),
        resourceType: 'credential',
        resourceId: String(user._id),
        action: 'credential.rotation',
        after: { rotated: true },
        reason: 'refresh token rotated',
      });

      res.json({ user, accessToken, refreshToken: newRefreshToken });
    } catch (err: any) {
      res.status(401).json({ error: err.message });
    }
  }

  static async logout(req: any, res: Response) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) return res.status(400).json({ error: 'refreshToken required' });

      if (!req.user) return res.status(401).json({ error: 'unauthenticated' });

      await AuthService.logout(req.user.userId, refreshToken);
      const user = await User.findById(req.user.userId).select('organization').lean();
      await emitAuditLog({
        workspaceId: user?.organization ? String(user.organization) : null,
        organizationId: user?.organization ? String(user.organization) : null,
        actorUserId: req.user.userId,
        resourceType: 'credential',
        resourceId: req.user.userId,
        action: 'credential.revocation',
        after: { revoked: true },
        reason: 'logout refresh token revoked',
      });
      res.status(204).send();
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async requestPasswordReset(req: Request, res: Response) {
    try {
      const { email } = req.body;
      const { resetToken, expiresAt } = await AuthService.requestPasswordReset(email);

      // TODO: send email via notifier infra. For now return token in response (dev)
      // In production, DO NOT return token in response — send via email.
      res.json({ resetToken, expiresAt });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  static async resetPassword(req: Request, res: Response) {
    try {
      const { email, token, newPassword } = req.body;
      await AuthService.resetPassword(email, token, newPassword);
      const user = await User.findOne({ email }).select('organization').lean();
      if (user) {
        await emitAuditLog({
          workspaceId: user.organization ? String(user.organization) : null,
          organizationId: user.organization ? String(user.organization) : null,
          actorUserId: String(user._id),
          resourceType: 'credential',
          resourceId: String(user._id),
          action: 'credential.rotation',
          after: { passwordReset: true, refreshTokensRevoked: true },
          reason: 'password reset',
        });
      }
      res.json({ message: 'Password reset successful' });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  // get current user info
  static async me(req: any, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'unauthenticated' });
      const user = await User.findOne(
        { _id: req.user.userId },
        {
          '-password': 0,
          '-refreshTokens': 0,
          '-resetPasswordToken': 0,
          '-resetPasswordExpires': 0,
        },
      );
      res.json(user);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
