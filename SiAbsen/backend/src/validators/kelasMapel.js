// src/validators/kelasMapel.js — Skema validasi Zod untuk penugasan kelas-mapel.
import { z } from 'zod';

export const createKelasMapelSchema = z.object({
  kelas_id: z.string({ required_error: 'Kelas wajib diisi' }).uuid('Kelas tidak valid'),
  mapel_id: z.string({ required_error: 'Mapel wajib diisi' }).uuid('Mapel tidak valid'),
});

// Query filter opsional untuk daftar penugasan.
export const listKelasMapelQuerySchema = z.object({
  kelas_id: z.string().uuid('Kelas tidak valid').optional(),
  mapel_id: z.string().uuid('Mapel tidak valid').optional(),
});
