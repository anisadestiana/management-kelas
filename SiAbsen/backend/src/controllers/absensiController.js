// src/controllers/absensiController.js — Controller Input Absensi.
import * as absensiService from '../services/absensi.js';
import { upsertAbsensiSchema, listAbsensiQuerySchema } from '../validators/absensi.js';
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
  const filter = validate(listAbsensiQuerySchema, req.query);
  const data = await absensiService.list(filter);
  res.json({ data });
});

export const upsert = asyncHandler(async (req, res) => {
  const { sesi_id, absensi } = validate(upsertAbsensiSchema, req.body);
  const hasil = await absensiService.upsert(sesi_id, absensi);
  res.json({ data: hasil });
});
