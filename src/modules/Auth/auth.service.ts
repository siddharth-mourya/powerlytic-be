import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../User/User.model';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';
const ACCESS_EXP = Number(process.env.JWT_ACCESS_EXPIRY) || 120; // 2minutes
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);
const RESET_TOKEN_EXP_MIN = parseInt(process.env.RESET_TOKEN_EXPIRY_MIN || '60', 10);

function signAccessToken(payload: object) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_EXP });
}

// function signRefreshToken(payload: object) {
//   return jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_EXP });
// }

function generateRandomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

export class AuthService {
  // login: returns access + refresh tokens
  static async login(email: string, password: string) {
    const user = await User.findOne({ email });
    if (!user) throw new Error('Invalid credentials');

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) throw new Error('Invalid credentials');

    const accessToken = signAccessToken({
      userId: user._id,
      role: user.role,
      orgId: user.organization ?? null,
    });

    const refreshTokenPlain = generateRandomToken(48);
    const refreshTokenHash = await bcrypt.hash(refreshTokenPlain, BCRYPT_ROUNDS);

    // store hashed refresh token (append)
    user.refreshTokens = user.refreshTokens || [];
    user.refreshTokens.push(refreshTokenHash);
    await user.save();

    // we return the plain refresh token to client (store securely)
    return {
      accessToken,
      refreshToken: refreshTokenPlain,
      user: { _id: user._id, email: user.email, role: user.role, organization: user.organization, name: user.name, phone: user.phone },
    };
  }

  // refresh: exchange refresh token for new access token (and optional new refresh)
  static async refresh(userId: string, refreshTokenPlain: string) {
    const user = await User.findById(userId);
    if (!user) throw new Error('Invalid refresh');

    // check the provided refresh token against stored hashes
    const tokens = user.refreshTokens || [];
    let foundIndex = -1;
    for (let i = 0; i < tokens.length; i++) {
      const match = await bcrypt.compare(refreshTokenPlain, tokens[i]);
      if (match) {
        foundIndex = i;
        break;
      }
    }
    if (foundIndex === -1) throw new Error('Invalid refresh token');

    // Issue new access token
    const accessToken = signAccessToken({
      userId: user._id,
      role: user.role,
      orgId: user.organization ?? null,
    });

    // rotate refresh token: remove old and add new
    const newRefreshPlain = generateRandomToken(48);
    const newRefreshHash = await bcrypt.hash(newRefreshPlain, BCRYPT_ROUNDS);

    // replace old token with new one
    user?.refreshTokens?.splice(foundIndex, 1, newRefreshHash);
    await user.save();

    return { accessToken, refreshToken: newRefreshPlain, user: { _id: user._id, email: user.email, role: user.role, organization: user.organization, name: user.name, phone: user.phone } };
  }

  // logout: revoke a refresh token
  static async logout(userId: string, refreshTokenPlain: string) {
    const user = await User.findById(userId);
    if (!user) return;
    user.refreshTokens = (user.refreshTokens || []).filter(async (storedHash) => {
      // we'll filter by comparing and excluding the matching one - but bcrypt compare is async
      return true; // placeholder; below we'll implement synchronous approach
    });
    // simpler: find index then splice (safer)
    let foundIndex = -1;
    for (let i = 0; i < (user.refreshTokens || []).length; i++) {
      // eslint-disable-next-line no-await-in-loop
      const match = await bcrypt.compare(refreshTokenPlain, (user.refreshTokens || [])[i]);
      if (match) {
        foundIndex = i;
        break;
      }
    }
    if (foundIndex >= 0) {
      user.refreshTokens.splice(foundIndex, 1);
      await user.save();
    }
    return;
  }

  // Request password reset: creates a token, saves hashed token + expiry, and returns plain token (send via email)
  static async requestPasswordReset(email: string) {
    const user = await User.findOne({ email });
    if (!user) throw new Error('User not found');

    const resetPlain = generateRandomToken(24);
    const resetHash = crypto.createHash('sha256').update(resetPlain).digest('hex');
    const expiresAt = new Date(Date.now() + RESET_TOKEN_EXP_MIN * 60_000);

    user.resetPasswordToken = resetHash;
    user.resetPasswordExpires = expiresAt;
    await user.save();

    // return plain token so caller can send it by email (or you can integrate email here)
    return { resetToken: resetPlain, expiresAt };
  }

  // Reset password using token
  static async resetPassword(email: string, tokenPlain: string, newPassword: string) {
    const user = await User.findOne({ email });
    if (!user) throw new Error('User not found');

    if (!user.resetPasswordToken || !user.resetPasswordExpires)
      throw new Error('No reset token set');
    const now = new Date();
    if (user.resetPasswordExpires < now) throw new Error('Reset token expired');

    const tokenHash = crypto.createHash('sha256').update(tokenPlain).digest('hex');
    if (tokenHash !== user.resetPasswordToken) throw new Error('Invalid reset token');

    // set new password and clear reset fields
    const hashed = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    user.password = hashed;
    user.resetPasswordToken = undefined as any;
    user.resetPasswordExpires = undefined as any;
    // also clear refresh tokens to force re-login
    user.refreshTokens = [];
    await user.save();
    return;
  }
}
