// src/validators/komponenNilai.js — Skema validasi Zod untuk komponen nilai.
import { z } from 'zod';

// bobot: 0..100 dengan maksimum 2 desimal (kolom numeric(5,2)).
const bobot = z
  .number({ required_error: 'Bobot wajib diisi', invalid_type_error: 'Bobot harus angka' })
  .min(0, 'Bobot minimal 0')
  .max(100, 'Bobot maksimal 100');

const urutan = z
  .number({ invalid_type_error: 'Urutan harus angka' })
  .int('Urutan harus bilangan bulat')
  .min(0, 'Urutan minimal 0')
  .optional();

export const createKomponenNilaiSchema = z.object({
  kelas_mapel_id: z
    .string({ required_error: 'Penugasan kelas-mapel wajib diisi' })
    .uuid('Penugasan kelas-mapel tidak valid'),
  nama: z.string({ required_error: 'Nama wajib diisi' }).trim().min(1, 'Nama wajib diisi'),
  bobot,
  urutan,
});

export const updateKomponenNilaiSchema = z
  .object({
    nama: z.string().trim().min(1, 'Nama wajib diisi').optional(),
    bobot: bobot.optional(),
    urutan,
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Minimal satu field harus diisi untuk pembaruan',
  });

export const listKomponenNilaiQuerySchema = z.object({
  kelas_mapel_id: z.string().uuid('Penugasan kelas-mapel tidak valid').optional(),
});
