// src/validators/siswa.js — Skema validasi Zod untuk endpoint siswa.
import { z } from 'zod';

// NIS dipakai sebagai username (lihat konvensi seed-data.js). Minimal 1 karakter,
// tanpa spasi di tepi.
const nis = z.string({ required_error: 'NIS wajib diisi' }).trim().min(1, 'NIS wajib diisi');
const namaLengkap = z
  .string({ required_error: 'Nama lengkap wajib diisi' })
  .trim()
  .min(1, 'Nama lengkap wajib diisi');

export const createSiswaSchema = z.object({
  nis,
  nama_lengkap: namaLengkap,
  // Password opsional saat create: bila kosong, dipakai password default.
  password: z.string().min(8, 'Password minimal 8 karakter').optional(),
  // Penempatan kelas opsional saat create.
  kelas_id: z.string().uuid('Kelas tidak valid').optional(),
});

export const updateSiswaSchema = z
  .object({
    nis: nis.optional(),
    nama_lengkap: namaLengkap.optional(),
    is_active: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Minimal satu field harus diisi untuk pembaruan',
  });

export const resetPasswordSchema = z.object({
  // Password baru opsional: bila kosong, dipakai password default.
  password: z.string().min(8, 'Password minimal 8 karakter').optional(),
});

export const listSiswaQuerySchema = z.object({
  kelas_id: z.string().uuid('Kelas tidak valid').optional(),
});
