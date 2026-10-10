import { Router } from 'express';
import { isDbConfigured, checkDbConnection } from '../db.js';

const router = Router();

/**
 * GET /api/health
 * Mengembalikan status kesehatan layanan.
 *
 * Response:
 *   { "status": "OK", "timestamp": "...", "database": "connected|not_configured|disconnected" }
 */
router.get('/health', async (_req, res) => {
  let database = 'not_configured';

  if (isDbConfigured) {
    const connected = await checkDbConnection();
    database = connected ? 'connected' : 'disconnected';
  }

  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    database,
  });
});

export default router;
