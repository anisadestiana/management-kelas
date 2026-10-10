// src/routes/komponenNilai.js — Router komponen nilai & bobot.
// Semua endpoint khusus guru (PRD §2.2: atur komponen nilai & bobot = Guru).
import { Router } from 'express';
import * as controller from '../controllers/komponenNilaiController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use('/komponen-nilai', requireAuth, requireRole('guru'));

router.get('/komponen-nilai', controller.list);
router.post('/komponen-nilai', controller.create);
router.get('/komponen-nilai/:id', controller.getById);
router.patch('/komponen-nilai/:id', controller.update);
router.delete('/komponen-nilai/:id', controller.remove);

export default router;
