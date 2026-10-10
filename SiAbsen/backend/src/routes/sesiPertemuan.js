// src/routes/sesiPertemuan.js — Router Sesi Pertemuan.
// Semua endpoint khusus guru (PRD §2.2: buat sesi = Guru).
import { Router } from 'express';
import * as controller from '../controllers/sesiPertemuanController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use('/sesi', requireAuth, requireRole('guru'));

router.get('/sesi', controller.list);
router.post('/sesi', controller.create);
router.get('/sesi/:id', controller.getById);
router.patch('/sesi/:id', controller.update);
router.delete('/sesi/:id', controller.remove);

export default router;
