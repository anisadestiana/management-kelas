// src/routes/mapel.js — Router CRUD Mapel.
// Semua endpoint khusus guru (PRD §2.2: CRUD mapel = Guru).
import { Router } from 'express';
import * as controller from '../controllers/mapelController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use('/mapel', requireAuth, requireRole('guru'));

router.get('/mapel', controller.list);
router.post('/mapel', controller.create);
router.get('/mapel/:id', controller.getById);
router.patch('/mapel/:id', controller.update);
router.delete('/mapel/:id', controller.remove);

export default router;
