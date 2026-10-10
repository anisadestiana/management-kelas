// src/routes/tahunAjaran.js — Router CRUD Tahun Ajaran.
// Semua endpoint khusus guru (PRD §2.2: CRUD tahun ajaran = Guru).
import { Router } from 'express';
import * as controller from '../controllers/tahunAjaranController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// Guru-only untuk seluruh resource ini.
router.use('/tahun-ajaran', requireAuth, requireRole('guru'));

router.get('/tahun-ajaran', controller.list);
router.post('/tahun-ajaran', controller.create);
router.get('/tahun-ajaran/:id', controller.getById);
router.patch('/tahun-ajaran/:id', controller.update);
router.delete('/tahun-ajaran/:id', controller.remove);

export default router;
