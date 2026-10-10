// src/validators/absensi.js — Skema validasi Zod untuk input absensi.
import { z } from 'zod';

// Enum status sesuai absensi_status di skema (0001_init.sql).
export const STATUS_ABSENSI = ['hadir', 'izin_sakit', 'terlambat', 'dispensasi', 'alpha'];

const status = z.enum(STATUS_ABSENSI, {
  required_error: 'Status wajib diisi',
  invalid_type_error: 'Status tidak valid',
});

const catatan = z.string().trim().min(1, 'Catatan tidak boleh string kosong').nullable().optional();

const absensiItem = z.object({
  siswa_id: z.string({ required_error: 'Siswa wajib diisi' }).uuid('Siswa tidak valid'),
  status,
  catatan,
});

export const upsertAbsensiSchema = z.object({
  sesi_id: z.string({ required_error: 'Sesi wajib diisi' }).uuid('Sesi tidak valid'),
  absensi: z.array(absensiItem).min(1, 'Minimal satu baris absensi'),
});

export const listAbsensiQuerySchema = z.object({
  sesi_id: z.string().uuid('Sesi tidak valid').optional(),
});
