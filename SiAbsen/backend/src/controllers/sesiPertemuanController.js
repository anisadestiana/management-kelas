// src/controllers/sesiPertemuanController.js — Controller Sesi Pertemuan.
import * as sesiService from '../services/sesiPertemuan.js';
import {
  createSesiSchema,
  updateSesiSchema,
  listSesiQuerySchema,
} from '../validators/sesiPertemuan.js';
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
  const filter = validate(listSesiQuerySchema, req.query);
  const data = await sesiService.list(filter);
  res.json({ data });
});

export const getById = asyncHandler(async (req, res) => {
  const data = await sesiService.getById(req.params.id);
  res.json({ data });
});

export const create = asyncHandler(async (req, res) => {
  const input = validate(createSesiSchema, req.body);
  const data = await sesiService.create(input);
  res.status(201).json({ data });
});

export const update = asyncHandler(async (req, res) => {
  const input = validate(updateSesiSchema, req.body);
  const data = await sesiService.update(req.params.id, input);
  res.json({ data });
});

export const remove = asyncHandler(async (req, res) => {
  await sesiService.remove(req.params.id);
  res.json({ message: 'Sesi pertemuan berhasil dihapus' });
});
