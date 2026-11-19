import { Router } from 'express';
import { handleGetSettings, handleUpdateSettings } from '../controllers/settingsController';
import { validateSettingsBody } from '../middleware/validation';

const router = Router();

router.get('/', handleGetSettings);
router.put('/', validateSettingsBody, handleUpdateSettings);

export default router;
