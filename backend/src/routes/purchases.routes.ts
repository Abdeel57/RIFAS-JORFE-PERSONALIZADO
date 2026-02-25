import { Router } from 'express';
import { createPurchase, uploadPaymentProof } from '../controllers/purchase.controller';

const router = Router();

router.post('/', createPurchase);
router.post('/:id/payment-proof', uploadPaymentProof);

export default router;
