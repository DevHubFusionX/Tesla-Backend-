import { Request, Response, RequestHandler } from 'express';
import { AuthExtensionService } from '../services/authExtension.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';

export class AuthExtensionController {
  static requestReset: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;
    const result = await AuthExtensionService.requestPasswordReset(email);
    sendSuccess(res, result, 'Hashed reset token generated and logged (simulated).');
  });

  static resetPassword: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const { token, newPassword } = req.body;
    await AuthExtensionService.resetPassword(token, newPassword);
    sendSuccess(res, null, 'Password has been reset successfully.');
  });

  static sendVerification: RequestHandler = asyncHandler(async (req: any, res: Response) => {
    const result = await AuthExtensionService.sendEmailVerification(req.user!.id);
    sendSuccess(res, result, 'Verification token generated and logged (simulated).');
  });

  static verifyEmail: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    const token = req.query.token as string;
    await AuthExtensionService.verifyEmail(token);
    sendSuccess(res, null, 'Email verified successfully.');
  });
}
