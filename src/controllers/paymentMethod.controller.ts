import { Response, RequestHandler } from 'express';
import { PaymentMethodService } from '../services/paymentMethod.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendCreated } from '../utils/response';

export class PaymentMethodController {
  static link: RequestHandler = asyncHandler(async (req: any, res: Response) => {
    const paymentMethod = await PaymentMethodService.linkPaymentMethod(req.user!.id, req.body);
    sendCreated(res, { paymentMethod }, 'Payment method linked successfully.');
  });

  static list: RequestHandler = asyncHandler(async (req: any, res: Response) => {
    const paymentMethods = await PaymentMethodService.getPaymentMethods(req.user!.id);
    sendSuccess(res, { paymentMethods });
  });

  static delete: RequestHandler = asyncHandler(async (req: any, res: Response) => {
    const paymentMethod = await PaymentMethodService.deletePaymentMethod(req.user!.id, req.params.id);
    sendSuccess(res, { paymentMethod }, 'Payment method removed successfully.');
  });

  static setDefault: RequestHandler = asyncHandler(async (req: any, res: Response) => {
    const paymentMethod = await PaymentMethodService.setDefault(req.user!.id, req.params.id);
    sendSuccess(res, { paymentMethod }, 'Default payment method updated.');
  });
}
