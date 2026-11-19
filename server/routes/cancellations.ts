import { Router } from 'express';
import {
  handleCreateCancellation,
  handleDeleteCancellation,
  handleGetCancellation,
  handleListCancellations,
  handleLogFollowUp,
  handleUpdateCancellation,
} from '../controllers/cancellationsController';
import {
  validateCancellationBody,
  validateFollowUpBody,
} from '../middleware/validation';

const router = Router();

router.get('/', handleListCancellations);
router.get('/:id', handleGetCancellation);
router.post('/', validateCancellationBody, handleCreateCancellation);
router.put('/:id', validateCancellationBody, handleUpdateCancellation);
router.post('/:id/follow-up', validateFollowUpBody, handleLogFollowUp);
router.delete('/:id', handleDeleteCancellation);

export default router;
