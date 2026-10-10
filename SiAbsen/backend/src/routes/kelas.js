// src/routes/kelas.js — Router CRUD Kelas.
// Semua endpoint khusus guru (PRD §2.2: CRUD kelas = Guru).
import { Router } from 'express';
import * as controller from '../controllers/kelasController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use('/kelas', requireAuth, requireRole('guru'));

router.get('/kelas', controller.list);
router.post('/kelas', controller.create);
router.get('/kelas/:id', controller.getById);
router.patch('/kelas/:id', controller.update);
router.delete('/kelas/:id', controller.remove);

export default router;
