import { Request, Response } from "express";
import { AuthService } from "./auth.service";

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const user = await AuthService.register(req.body);
      res.status(201).json(user);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const tokens = await AuthService.login(email, password);
      res.json(tokens);
    } catch (err: any) {
      res.status(401).json({ error: err.message });
    }
  }

  static async refresh(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;
      const accessToken = await AuthService.refresh(refreshToken);
      res.json({ accessToken });
    } catch (err: any) {
      res.status(401).json({ error: err.message });
    }
  }
}
