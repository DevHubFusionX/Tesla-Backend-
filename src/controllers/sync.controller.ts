import { Request, Response, RequestHandler } from 'express';
import { SyncService } from '../services/sync.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';
import { UnauthorizedError } from '../utils/errors';

export class SyncController {
  /**
   * Helper to verify if the request is authorized.
   * Can be authorized by either:
   * 1. A valid internal sync token in the headers: `x-sync-token`
   * 2. An authenticated admin user (handled by middleware, but check role here just in case)
   */
  private static authorizeSync(req: Request) {
    const syncTokenHeader = req.headers['x-sync-token'];
    const expectedToken = process.env.SYNC_TOKEN || 'local_sync_token_secret_123';
    
    const isTokenValid = syncTokenHeader === expectedToken;
    const isAdminUser = (req as any).user?.role === 'ADMIN';

    if (!isTokenValid && !isAdminUser) {
      throw new UnauthorizedError('Unauthorized sync request. Missing or invalid authorization.');
    }
  }

  /**
   * Scan and mature all investments that reached maturityDate.
   */
  static mature: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    SyncController.authorizeSync(req);
    const result = await SyncService.matureInvestments();
    sendSuccess(res, result, 'Investment maturity sync completed.');
  });

  /**
   * Scan and snapshot valuations for active investments.
   */
  static snapshot: RequestHandler = asyncHandler(async (req: Request, res: Response) => {
    SyncController.authorizeSync(req);
    const result = await SyncService.snapshotValuations();
    sendSuccess(res, result, 'Investment valuations snapshot completed.');
  });
}

