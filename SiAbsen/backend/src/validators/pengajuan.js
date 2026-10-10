// src/validators/pengajuan.js — Skema validasi Zod untuk pengajuan izin/sakit.
import { z } from 'zod';

const tanggal = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD');

// IZN-6: rentang tidak boleh mundur lebih dari 14 hari dari hari ini,
// dan panjang rentang maksimal 14 hari. Dihitung dalam UTC date (tanpa jam).
const MAX_RENTANG_HARI = 14;
const MAX_MUNDUR_HARI = 14;

function toUtcDate(str) {
  const [y, m, d] = str.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

export const createPengajuanSchema = z
  .object({
    jenis: z.enum(['izin', 'sakit'], {
      required_error: 'Jenis wajib diisi',
      invalid_type_error: "Jenis harus 'izin' atau 'sakit'",
    }),
    tanggal_mulai: tanggal,
    tanggal_selesai: tanggal,
    // IZN-1: alasan teks maksimal 500 karakter.
    alasan: z.string().trim().max(500, 'Alasan maksimal 500 karakter').optional().nullable(),
  })
  .superRefine((data, ctx) => {
    const mulai = toUtcDate(data.tanggal_mulai);
    const selesai = toUtcDate(data.tanggal_selesai);

    if (selesai < mulai) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['tanggal_selesai'],
        message: 'Tanggal selesai tidak boleh sebelum tanggal mulai',
      });
      return;
    }

    const satuHari = 24 * 60 * 60 * 1000;
    const panjangHari = Math.round((selesai - mulai) / satuHari) + 1; // inklusif
    if (panjangHari > MAX_RENTANG_HARI) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['tanggal_selesai'],
        message: `Rentang maksimal ${MAX_RENTANG_HARI} hari`,
      });
    }

    // Tidak boleh mundur lebih dari 14 hari dari hari ini (UTC).
    const now = new Date();
    const hariIni = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const mundurHari = Math.round((hariIni - mulai) / satuHari);
    if (mundurHari > MAX_MUNDUR_HARI) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['tanggal_mulai'],
        message: `Tanggal mulai tidak boleh mundur lebih dari ${MAX_MUNDUR_HARI} hari`,
      });
    }
  });

export const putuskanPengajuanSchema = z.object({
  keputusan: z.enum(['setujui', 'tolak'], {
    required_error: 'Keputusan wajib diisi',
    invalid_type_error: "Keputusan harus 'setujui' atau 'tolak'",
  }),
  catatan_guru: z.string().trim().max(500, 'Catatan maksimal 500 karakter').optional().nullable(),
});

export const listPengajuanQuerySchema = z.object({
  status: z.enum(['menunggu', 'disetujui', 'ditolak', 'dibatalkan']).optional(),
});
