import { Response, RequestHandler } from 'express';
import { KycService } from '../services/kyc.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendCreated } from '../utils/response';

export class KycController {
  static submit: RequestHandler = asyncHandler(async (req: any, res: Response) => {
    const kyc = await KycService.submitKyc(req.user!.id, req.body);
    sendCreated(res, { kyc }, 'KYC document submitted for review.');
  });

  static getStatus: RequestHandler = asyncHandler(async (req: any, res: Response) => {
    const result = await KycService.getKycStatus(req.user!.id);
    sendSuccess(res, result);
  });

  static review: RequestHandler = asyncHandler(async (req: any, res: Response) => {
    const { userId } = req.params;
    const { status, rejectionReason } = req.body;
    const kyc = await KycService.reviewKyc(userId, status, rejectionReason);
    sendSuccess(res, { kyc }, `KYC profile has been ${status.toLowerCase()}.`);
  });
}
