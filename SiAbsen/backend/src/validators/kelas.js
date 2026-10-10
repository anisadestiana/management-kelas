// src/validators/kelas.js — Skema validasi Zod untuk endpoint kelas.
import { z } from 'zod';

export const createKelasSchema = z.object({
  tahun_ajaran_id: z
    .string({ required_error: 'Tahun ajaran wajib diisi' })
    .uuid('Tahun ajaran tidak valid'),
  nama: z.string({ required_error: 'Nama wajib diisi' }).trim().min(1, 'Nama wajib diisi'),
});

// Semua field opsional saat update, tapi minimal satu harus dikirim.
export const updateKelasSchema = createKelasSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Minimal satu field harus diisi untuk pembaruan',
  });
