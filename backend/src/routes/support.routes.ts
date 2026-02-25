import { Router } from 'express';
import { handleChat } from '../controllers/support.controller';

const router = Router();

router.post('/chat', handleChat);

export default router;






