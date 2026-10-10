// src/routes/pengajuan.js — Router Pengajuan Izin/Sakit (role campuran).
//
// - GET  /pengajuan            : guru & siswa (controller membatasi scope siswa)
// - POST /pengajuan            : siswa (ajukan)
// - POST /pengajuan/:id/batal  : siswa (batalkan miliknya, status menunggu)
// - POST /pengajuan/:id/putuskan: guru (setujui/tolak)
import { Router } from 'express';
import * as controller from '../controllers/pengajuanController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// Semua endpoint pengajuan butuh autentikasi.
router.use('/pengajuan', requireAuth);

router.get('/pengajuan', controller.list); // guru & siswa
router.post('/pengajuan', requireRole('siswa'), controller.create);
router.post('/pengajuan/:id/batal', requireRole('siswa'), controller.batal);
router.post('/pengajuan/:id/putuskan', requireRole('guru'), controller.putuskan);

export default router;
