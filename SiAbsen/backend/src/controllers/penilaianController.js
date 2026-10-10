// src/controllers/penilaianController.js — Controller Penilaian.
import * as penilaianService from '../services/penilaian.js';
import {
  createPenilaianSchema,
  updatePenilaianSchema,
  listPenilaianQuerySchema,
} from '../validators/penilaian.js';
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
  const filter = validate(listPenilaianQuerySchema, req.query);
  const data = await penilaianService.list(filter);
  res.json({ data });
});

export const getById = asyncHandler(async (req, res) => {
  const data = await penilaianService.getById(req.params.id);
  res.json({ data });
});

export const create = asyncHandler(async (req, res) => {
  const input = validate(createPenilaianSchema, req.body);
  const data = await penilaianService.create(input);
  res.status(201).json({ data });
});

export const update = asyncHandler(async (req, res) => {
  const input = validate(updatePenilaianSchema, req.body);
  const data = await penilaianService.update(req.params.id, input);
  res.json({ data });
});

export const remove = asyncHandler(async (req, res) => {
  await penilaianService.remove(req.params.id);
  res.json({ message: 'Penilaian berhasil dihapus' });
});
