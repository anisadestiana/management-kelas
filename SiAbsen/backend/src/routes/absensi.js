// src/routes/absensi.js — Router Input Absensi.
// Semua endpoint khusus guru (PRD §2.2: input absensi = Guru).
import { Router } from 'express';
import * as controller from '../controllers/absensiController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use('/absensi', requireAuth, requireRole('guru'));

router.get('/absensi', controller.list);
router.put('/absensi', controller.upsert); // bulk upsert untuk satu sesi

export default router;
