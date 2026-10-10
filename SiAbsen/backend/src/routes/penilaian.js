// src/routes/penilaian.js — Router Penilaian.
// Semua endpoint khusus guru (PRD §2.2: CRUD penilaian = Guru).
import { Router } from 'express';
import * as controller from '../controllers/penilaianController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use('/penilaian', requireAuth, requireRole('guru'));

router.get('/penilaian', controller.list);
router.post('/penilaian', controller.create);
router.get('/penilaian/:id', controller.getById);
router.patch('/penilaian/:id', controller.update);
router.delete('/penilaian/:id', controller.remove);

export default router;
