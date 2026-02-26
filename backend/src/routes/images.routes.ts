import { Router } from 'express';
import { getImageById } from '../controllers/image.controller';

const router = Router();

router.get('/:id', getImageById);

export default router;
