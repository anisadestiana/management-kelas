// src/validators/sesiPertemuan.js — Skema validasi Zod untuk sesi pertemuan.
import { z } from 'zod';

const tanggal = z
  .string({ required_error: 'Tanggal wajib diisi' })
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD');

const pertemuanKe = z
  .number({ required_error: 'Pertemuan ke wajib diisi', invalid_type_error: 'Pertemuan ke harus angka' })
  .int('Pertemuan ke harus bilangan bulat')
  .min(1, 'Pertemuan ke minimal 1');

const topik = z.string().trim().min(1, 'Topik tidak boleh string kosong').nullable().optional();

export const createSesiSchema = z.object({
  kelas_mapel_id: z
    .string({ required_error: 'Penugasan kelas-mapel wajib diisi' })
    .uuid('Penugasan kelas-mapel tidak valid'),
  tanggal,
  pertemuan_ke: pertemuanKe,
  topik,
});

export const updateSesiSchema = z
  .object({
    tanggal: tanggal.optional(),
    pertemuan_ke: pertemuanKe.optional(),
    topik,
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Minimal satu field harus diisi untuk pembaruan',
  });

export const listSesiQuerySchema = z.object({
  kelas_mapel_id: z.string().uuid('Penugasan kelas-mapel tidak valid').optional(),
});
