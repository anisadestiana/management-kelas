import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import healthRoutes from './routes/health.js';
import authRoutes from './routes/auth.js';
import tahunAjaranRoutes from './routes/tahunAjaran.js';
import kelasRoutes from './routes/kelas.js';
import errorHandler from './middleware/errorHandler.js';

/**
 * Instance Express tanpa app.listen() agar dapat dipakai ulang baik untuk
 * server lokal (src/server.js) maupun sebagai handler serverless (mis. Vercel).
 */
const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Semua endpoint API memakai prefix /api
app.use('/api', healthRoutes);
app.use('/api', authRoutes);
app.use('/api', tahunAjaranRoutes);
app.use('/api', kelasRoutes);

// 404 untuk rute yang tidak dikenal
app.use((_req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Rute tidak ditemukan' } });
});

// Penangan error terpusat — HARUS menjadi middleware terakhir
app.use(errorHandler);

export default app;
