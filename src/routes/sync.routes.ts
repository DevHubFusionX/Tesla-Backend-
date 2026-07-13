import { Router } from 'express';
import { SyncController } from '../controllers/sync.controller';
import { authenticate } from '../middleware/auth.middleware';

const router: Router = Router();

/**
 * Optional session authenticate.
 * If authentication fails, the controller's authorizeSync check will still run
 * and verify the x-sync-token header.
 */
const optionalAuthenticate = (req: any, res: any, next: any) => {
  authenticate(req, res, (err) => {
    // Ignore error, proceed to controller where header token or admin role is validated
    next();
  });
};

router.post('/mature', optionalAuthenticate as any, SyncController.mature);
router.post('/snapshot', optionalAuthenticate as any, SyncController.snapshot);

export default router;
