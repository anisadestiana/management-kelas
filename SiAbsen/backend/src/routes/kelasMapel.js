// src/routes/kelasMapel.js — Router penugasan Kelas-Mapel.
// Semua endpoint khusus guru (PRD §2.2: penugasan mapel = Guru).
import { Router } from 'express';
import * as controller from '../controllers/kelasMapelController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use('/kelas-mapel', requireAuth, requireRole('guru'));

router.get('/kelas-mapel', controller.list);
router.post('/kelas-mapel', controller.create);
router.get('/kelas-mapel/:id', controller.getById);
router.delete('/kelas-mapel/:id', controller.remove);

export default router;
