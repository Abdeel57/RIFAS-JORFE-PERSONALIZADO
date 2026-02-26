import { Router } from 'express';
import { authenticateAdmin } from '../middleware/auth.middleware';
import { login } from '../controllers/admin/auth.controller';
import { getDashboardStats } from '../controllers/admin/dashboard.controller';
import {
  getAllRaffles,
  createRaffle,
  updateRaffle,
  deleteRaffle,
} from '../controllers/admin/raffle.controller';
import {
  getTickets,
  updateTicket,
} from '../controllers/admin/ticket.controller';
import {
  getPurchases,
  getPurchaseById,
  updatePurchaseStatus,
} from '../controllers/admin/purchase.controller';
import {
  getUsers,
  getUserById,
} from '../controllers/admin/user.controller';
import { uploadImage } from '../controllers/image.controller';
import { uploadImageMiddleware } from '../middleware/upload.middleware';

const router = Router();

// Auth (público)
router.post('/auth/login', login);

// Todas las rutas siguientes requieren autenticación
router.use(authenticateAdmin);

// Dashboard
router.get('/dashboard/stats', getDashboardStats);

// Upload de imagen (desde dispositivo → BD, alta calidad)
router.post('/upload-image', uploadImageMiddleware, uploadImage);

// Raffles
router.get('/raffles', getAllRaffles);
router.post('/raffles', createRaffle);
router.put('/raffles/:id', updateRaffle);
router.delete('/raffles/:id', deleteRaffle);

// Tickets
router.get('/tickets', getTickets);
router.put('/tickets/:id', updateTicket);

// Purchases
router.get('/purchases', getPurchases);
router.get('/purchases/:id', getPurchaseById);
router.put('/purchases/:id/status', updatePurchaseStatus);

// Users
router.get('/users', getUsers);
router.get('/users/:id', getUserById);

export default router;






