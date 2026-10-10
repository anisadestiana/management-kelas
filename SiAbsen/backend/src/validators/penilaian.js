// src/validators/penilaian.js — Skema validasi Zod untuk penilaian.
import { z } from 'zod';

const tanggalOpsional = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD')
  .nullable()
  .optional();

export const createPenilaianSchema = z.object({
  komponen_id: z
    .string({ required_error: 'Komponen nilai wajib diisi' })
    .uuid('Komponen nilai tidak valid'),
  judul: z.string({ required_error: 'Judul wajib diisi' }).trim().min(1, 'Judul wajib diisi'),
  tanggal: tanggalOpsional,
});

export const updatePenilaianSchema = z
  .object({
    judul: z.string().trim().min(1, 'Judul wajib diisi').optional(),
    tanggal: tanggalOpsional,
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Minimal satu field harus diisi untuk pembaruan',
  });

export const listPenilaianQuerySchema = z.object({
  komponen_id: z.string().uuid('Komponen nilai tidak valid').optional(),
});
