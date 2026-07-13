import { Request, Response, RequestHandler } from 'express';
import { AuthService } from '../services/auth.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendCreated } from '../utils/response';

export class AuthController {
  static register: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const { name, email, password } = req.body;
    const result = await AuthService.register(name, email, password);
    sendCreated(res, result, 'Account created successfully.');
  });

  static login: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const result = await AuthService.login(email, password);
    sendSuccess(res, result, 'Login successful.');
  });

  static getMe: RequestHandler = asyncHandler(async (req: any, res: Response) => {
    const user = await AuthService.getProfile(req.user!.id);
    sendSuccess(res, { user });
  });

  static updateMe: RequestHandler = asyncHandler(async (req: any, res: Response) => {
    const { name, email, phone, location, currency, password, currentPassword } = req.body;
    const user = await AuthService.updateProfile(req.user!.id, { name, email, phone, location, currency, password, currentPassword });
    sendSuccess(res, { user }, 'Profile updated successfully.');
  });

  static logout: RequestHandler = asyncHandler(async (req: any, res: Response) => {
    sendSuccess(res, null, 'Logged out successfully.');
  });
}


