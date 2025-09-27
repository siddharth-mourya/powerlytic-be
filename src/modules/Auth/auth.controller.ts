import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { User } from '../User/User.model';

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

      const { accessToken, refreshToken: newRefreshToken, user } = await AuthService.refresh(userId, refreshToken);

      res.json({ user, accessToken, refreshToken: newRefreshToken });
    } catch (err: any) {
      res.status(401).json({ error: err.message });
    }
  }

  static async logout(req: any, res: Response) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken)
        return res.status(400).json({ error: 'refreshToken required' });

      if (!req.user) return res.status(401).json({ error: 'unauthenticated' });

      await AuthService.logout(req.user.userId, refreshToken);
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
