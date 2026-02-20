import { Router } from 'express';
import { createPurchase } from '../controllers/purchase.controller';

const router = Router();

router.post('/', createPurchase);

export default router;





