// src/validators/nilai.js — Skema validasi Zod untuk input nilai.
import { z } from 'zod';

// skor: 0..100 (numeric(5,2) + CHECK di DB) atau null untuk mengosongkan.
const skor = z
  .number({ invalid_type_error: 'Skor harus angka' })
  .min(0, 'Skor minimal 0')
  .max(100, 'Skor maksimal 100')
  .nullable();

const nilaiItem = z.object({
  siswa_id: z.string({ required_error: 'Siswa wajib diisi' }).uuid('Siswa tidak valid'),
  skor,
});

export const upsertNilaiSchema = z.object({
  penilaian_id: z
    .string({ required_error: 'Penilaian wajib diisi' })
    .uuid('Penilaian tidak valid'),
  nilai: z.array(nilaiItem).min(1, 'Minimal satu baris nilai'),
});

export const listNilaiQuerySchema = z.object({
  penilaian_id: z.string().uuid('Penilaian tidak valid').optional(),
});
