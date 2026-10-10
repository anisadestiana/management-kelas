// src/controllers/kelasMapelController.js — Controller penugasan Kelas-Mapel.
import * as kelasMapelService from '../services/kelasMapel.js';
import {
  createKelasMapelSchema,
  listKelasMapelQuerySchema,
} from '../validators/kelasMapel.js';
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
  const filter = validate(listKelasMapelQuerySchema, req.query);
  const data = await kelasMapelService.list(filter);
  res.json({ data });
});

export const getById = asyncHandler(async (req, res) => {
  const data = await kelasMapelService.getById(req.params.id);
  res.json({ data });
});

export const create = asyncHandler(async (req, res) => {
  const input = validate(createKelasMapelSchema, req.body);
  const data = await kelasMapelService.create(input);
  res.status(201).json({ data });
});

export const remove = asyncHandler(async (req, res) => {
  await kelasMapelService.remove(req.params.id);
  res.json({ message: 'Penugasan berhasil dibatalkan' });
});
