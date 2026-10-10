// src/validators/mapel.js — Skema validasi Zod untuk endpoint mapel.
import { z } from 'zod';

// kode opsional: string tidak kosong, atau null untuk mengosongkan.
const kodeOpsional = z.string().trim().min(1, 'Kode tidak boleh string kosong').nullable().optional();

export const createMapelSchema = z.object({
  nama: z.string({ required_error: 'Nama wajib diisi' }).trim().min(1, 'Nama wajib diisi'),
  kode: kodeOpsional,
});

// Semua field opsional saat update, tapi minimal satu harus dikirim.
export const updateMapelSchema = createMapelSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Minimal satu field harus diisi untuk pembaruan',
  });
