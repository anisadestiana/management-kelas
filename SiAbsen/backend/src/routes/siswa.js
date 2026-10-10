// src/routes/siswa.js — Router CRUD Siswa.
// Semua endpoint khusus guru (PRD §2.2: CRUD siswa & reset password = Guru).
import { Router } from 'express';
import * as controller from '../controllers/siswaController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use('/siswa', requireAuth, requireRole('guru'));

router.get('/siswa', controller.list);
router.post('/siswa', controller.create);
router.get('/siswa/:id', controller.getById);
router.patch('/siswa/:id', controller.update);
router.post('/siswa/:id/reset-password', controller.resetPassword);
router.delete('/siswa/:id', controller.remove);

export default router;
