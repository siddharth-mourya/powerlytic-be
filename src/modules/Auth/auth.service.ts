import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../User/User.model";
import { IUser } from "../User/User.model";

const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

export class AuthService {
  static async register(payload: {
    email: string;
    password: string;
    name: string;
    role?: string;
    organizationId?: string;
  }): Promise<IUser> {
    const existing = await User.findOne({ email: payload.email });
    if (existing) throw new Error("Email already exists");

    const hashedPassword = await bcrypt.hash(payload.password, 10);

    const user = new User({
      email: payload.email,
      password: hashedPassword,
      name: payload.name,
      role: payload.role || "User",
      organization: payload.organizationId,
    });

    await user.save();
    return user;
  }

  static async login(email: string, password: string) {
    const user = await User.findOne({ email });
    if (!user) throw new Error("Invalid credentials");

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new Error("Invalid credentials");

    const accessToken = jwt.sign(
      { userId: user._id, role: user.role, orgId: user.organization },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    const refreshToken = jwt.sign(
      { userId: user._id },
      JWT_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRY }
    );

    return { accessToken, refreshToken, user };
  }

  static async refresh(token: string) {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as any;
      const accessToken = jwt.sign(
        { userId: payload.userId },
        JWT_SECRET,
        { expiresIn: ACCESS_TOKEN_EXPIRY }
      );
      return accessToken;
    } catch (err) {
      throw new Error("Invalid refresh token");
    }
  }
}
