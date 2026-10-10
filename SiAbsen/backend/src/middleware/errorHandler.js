// src/middleware/errorHandler.js — Satu-satunya penegak envelope error:
//   { error: { code, message, details? } }
// Harus dipasang sebagai middleware TERAKHIR di app.js.
import { ZodError } from 'zod';

// eslint-disable-next-line no-unused-vars
export default function errorHandler(err, req, res, next) {
  // Error validasi Zod atau yang ditandai VALIDATION_ERROR
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Input tidak valid',
        details: err.flatten().fieldErrors,
      },
    });
  }

  if (err && err.code === 'VALIDATION_ERROR') {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: err.message || 'Input tidak valid',
        ...(err.details !== undefined ? { details: err.details } : {}),
      },
    });
  }

  // AppError atau error dengan status + code
  const status = err && (err.status || err.statusCode);
  if (status && err.code) {
    return res.status(status).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details !== undefined ? { details: err.details } : {}),
      },
    });
  }

  // Error tak terduga: catat di server, jangan bocorkan ke klien
  console.error('Kesalahan tidak tertangani:', err);
  return res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Terjadi kesalahan pada server',
    },
  });
}
