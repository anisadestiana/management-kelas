// src/routes/nilai.js — Router Input Nilai.
// Semua endpoint khusus guru (PRD §2.2: CRUD penilaian & input nilai = Guru).
import { Router } from 'express';
import * as controller from '../controllers/nilaiController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use('/nilai', requireAuth, requireRole('guru'));

router.get('/nilai', controller.list);
router.put('/nilai', controller.upsert); // bulk upsert untuk satu penilaian

export default router;
