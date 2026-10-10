// src/controllers/nilaiController.js — Controller Input Nilai.
import * as nilaiService from '../services/nilai.js';
import { upsertNilaiSchema, listNilaiQuerySchema } from '../validators/nilai.js';
import { AppError } from '../lib/appError.js';

// Bungkus handler async agar error terlempar sampai ke next(err).
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

function validate(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new AppError(
      'VALIDATION_ERROR',
      'Input tidak valid',
      400,
      result.error.flatten().fieldErrors
    );
  }
  return result.data;
}

export const list = asyncHandler(async (req, res) => {
  const filter = validate(listNilaiQuerySchema, req.query);
  const data = await nilaiService.list(filter);
  res.json({ data });
});

export const upsert = asyncHandler(async (req, res) => {
  const { penilaian_id, nilai } = validate(upsertNilaiSchema, req.body);
  const hasil = await nilaiService.upsert(penilaian_id, nilai);
  res.json({ data: hasil });
});
