// src/lib/appError.js — Error terstruktur agar handler dapat memetakan ke
// envelope { error: { code, message, details? } } secara konsisten.

export class AppError extends Error {
  constructor(code, message, status = 400, details) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    this.statusCode = status;
    if (details !== undefined) {
      this.details = details;
    }
  }
}
