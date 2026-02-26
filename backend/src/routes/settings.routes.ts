import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settings.controller';
import { authenticateAdmin } from '../middleware/auth.middleware';

const router = Router();

// Public route for frontend to fetch settings (bank details, etc)
router.get('/', getSettings);

// Admin only route to update settings
router.put('/', authenticateAdmin, updateSettings);

export default router;
