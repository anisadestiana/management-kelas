// src/validators/tahunAjaran.js — Skema validasi Zod untuk endpoint tahun ajaran.
import { z } from 'zod';

// Tanggal opsional dalam format YYYY-MM-DD (atau null untuk mengosongkan).
const tanggalOpsional = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD')
  .nullable()
  .optional();

export const createTahunAjaranSchema = z.object({
  nama: z.string({ required_error: 'Nama wajib diisi' }).trim().min(1, 'Nama wajib diisi'),
  semester: z.enum(['ganjil', 'genap'], {
    required_error: 'Semester wajib diisi',
    invalid_type_error: "Semester harus 'ganjil' atau 'genap'",
  }),
  tanggal_mulai: tanggalOpsional,
  tanggal_selesai: tanggalOpsional,
  is_aktif: z.boolean().optional(),
});

// Semua field opsional saat update, tapi minimal satu harus dikirim.
export const updateTahunAjaranSchema = createTahunAjaranSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Minimal satu field harus diisi untuk pembaruan',
  });
