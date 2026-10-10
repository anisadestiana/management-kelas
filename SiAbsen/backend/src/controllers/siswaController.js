// src/controllers/siswaController.js — Controller CRUD Siswa.
import * as siswaService from '../services/siswa.js';
import {
  createSiswaSchema,
  updateSiswaSchema,
  resetPasswordSchema,
  listSiswaQuerySchema,
} from '../validators/siswa.js';
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
  const filter = validate(listSiswaQuerySchema, req.query);
  const data = await siswaService.list(filter);
  res.json({ data });
});

export const getById = asyncHandler(async (req, res) => {
  const data = await siswaService.getById(req.params.id);
  res.json({ data });
});

export const create = asyncHandler(async (req, res) => {
  const input = validate(createSiswaSchema, req.body);
  const data = await siswaService.create(input);
  res.status(201).json({ data });
});

export const update = asyncHandler(async (req, res) => {
  const input = validate(updateSiswaSchema, req.body);
  const data = await siswaService.update(req.params.id, input);
  res.json({ data });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { password } = validate(resetPasswordSchema, req.body ?? {});
  await siswaService.resetPassword(req.params.id, password);
  res.json({ message: 'Password siswa berhasil direset' });
});

export const remove = asyncHandler(async (req, res) => {
  await siswaService.remove(req.params.id);
  res.json({ message: 'Siswa berhasil dihapus' });
});
