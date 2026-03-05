import { Router } from 'express';
import { getComprobante } from '../controllers/comprobante.controller';

const router = Router();

router.get('/:purchaseId', getComprobante);

export default router;
