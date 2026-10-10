// src/controllers/mapelController.js — Controller CRUD Mapel.
import * as mapelService from '../services/mapel.js';
import { createMapelSchema, updateMapelSchema } from '../validators/mapel.js';
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

export const list = asyncHandler(async (_req, res) => {
  const data = await mapelService.list();
  res.json({ data });
});

export const getById = asyncHandler(async (req, res) => {
  const data = await mapelService.getById(req.params.id);
  res.json({ data });
});

export const create = asyncHandler(async (req, res) => {
  const input = validate(createMapelSchema, req.body);
  const data = await mapelService.create(input);
  res.status(201).json({ data });
});

export const update = asyncHandler(async (req, res) => {
  const input = validate(updateMapelSchema, req.body);
  const data = await mapelService.update(req.params.id, input);
  res.json({ data });
});

export const remove = asyncHandler(async (req, res) => {
  await mapelService.remove(req.params.id);
  res.json({ message: 'Mapel berhasil dihapus' });
});
