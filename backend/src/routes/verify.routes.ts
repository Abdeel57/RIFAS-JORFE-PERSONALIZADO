import { Router } from 'express';
import { verifyTickets } from '../controllers/verify.controller';

const router = Router();

router.post('/', verifyTickets);

export default router;






