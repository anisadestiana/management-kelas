// src/controllers/komponenNilaiController.js — Controller komponen nilai.
import * as komponenNilaiService from '../services/komponenNilai.js';
import {
  createKomponenNilaiSchema,
  updateKomponenNilaiSchema,
  listKomponenNilaiQuerySchema,
} from '../validators/komponenNilai.js';
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
  const filter = validate(listKomponenNilaiQuerySchema, req.query);
  const data = await komponenNilaiService.list(filter);
  res.json({ data });
});

export const getById = asyncHandler(async (req, res) => {
  const data = await komponenNilaiService.getById(req.params.id);
  res.json({ data });
});

export const create = asyncHandler(async (req, res) => {
  const input = validate(createKomponenNilaiSchema, req.body);
  const data = await komponenNilaiService.create(input);
  res.status(201).json({ data });
});

export const update = asyncHandler(async (req, res) => {
  const input = validate(updateKomponenNilaiSchema, req.body);
  const data = await komponenNilaiService.update(req.params.id, input);
  res.json({ data });
});

export const remove = asyncHandler(async (req, res) => {
  await komponenNilaiService.remove(req.params.id);
  res.json({ message: 'Komponen nilai berhasil dihapus' });
});
