import { Router } from 'express';
import { getRaffles, getRaffleById, getRaffleTickets } from '../controllers/raffle.controller';

const router = Router();

router.get('/', getRaffles);
router.get('/:id', getRaffleById);
router.get('/:id/tickets', getRaffleTickets);

export default router;





