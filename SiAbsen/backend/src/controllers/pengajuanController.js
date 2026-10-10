// src/controllers/pengajuanController.js — Controller Pengajuan Izin/Sakit.
import * as pengajuanService from '../services/pengajuan.js';
import {
  createPengajuanSchema,
  putuskanPengajuanSchema,
  listPengajuanQuerySchema,
} from '../validators/pengajuan.js';
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

// Siswa membuat pengajuan untuk dirinya sendiri (id dari token, bukan body).
export const create = asyncHandler(async (req, res) => {
  const input = validate(createPengajuanSchema, req.body);
  const data = await pengajuanService.create(req.user.id, input);
  res.status(201).json({ data });
});

// Daftar pengajuan. Guru melihat semua (filter status); siswa hanya miliknya.
export const list = asyncHandler(async (req, res) => {
  const { status } = validate(listPengajuanQuerySchema, req.query);
  const siswaId = req.user.role === 'guru' ? null : req.user.id;
  const data = await pengajuanService.list({ siswaId, status });
  res.json({ data });
});

// Siswa membatalkan pengajuannya (selama masih 'menunggu').
export const batal = asyncHandler(async (req, res) => {
  const data = await pengajuanService.batal(req.params.id, req.user.id);
  res.json({ data });
});

// Guru menyetujui/menolak pengajuan.
export const putuskan = asyncHandler(async (req, res) => {
  const { keputusan, catatan_guru } = validate(putuskanPengajuanSchema, req.body);
  const data = await pengajuanService.putuskan(req.params.id, req.user.id, keputusan, catatan_guru);
  res.json({ data });
});
