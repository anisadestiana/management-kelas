// src/validators/auth.js — Skema validasi Zod untuk endpoint auth.
import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string({ required_error: 'Username wajib diisi' }).min(1, 'Username wajib diisi'),
  password: z.string({ required_error: 'Password wajib diisi' }).min(1, 'Password wajib diisi'),
});

export const changePasswordSchema = z.object({
  oldPassword: z
    .string({ required_error: 'Password lama wajib diisi' })
    .min(1, 'Password lama wajib diisi'),
  newPassword: z
    .string({ required_error: 'Password baru wajib diisi' })
    .min(8, 'Password baru minimal 8 karakter'),
});
