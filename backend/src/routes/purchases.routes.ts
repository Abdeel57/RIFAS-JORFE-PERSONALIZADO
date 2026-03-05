import { Router } from 'express';
import { createPurchase, uploadPaymentProof, getPurchase } from '../controllers/purchase.controller';

const router = Router();

router.post('/', createPurchase);
router.get('/:id', getPurchase);
router.post('/:id/payment-proof', uploadPaymentProof);

export default router;
