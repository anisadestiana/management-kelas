// Pembungkus kecil di sekitar fetch yang memusatkan:
// - credentials: 'include' (agar cookie httpOnly `token` selalu dikirim)
// - header JSON
// - parsing JSON + normalisasi error backend berbentuk { error: { code, message } }
//
// Token TIDAK PERNAH dibaca/disimpan di JS (cookie httpOnly, tidak terlihat
// oleh JavaScript); sesi dipulihkan lewat GET /api/auth/me.

export class ApiError extends Error {
  constructor(message, { status, code } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export async function apiFetch(path, options = {}) {
  const { headers, body, ...rest } = options;

  const res = await fetch(path, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body,
    ...rest,
  });

  // 204 / body kosong
  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    const errObj = data && data.error ? data.error : {};
    throw new ApiError(errObj.message || `HTTP ${res.status}`, {
      status: res.status,
      code: errObj.code,
    });
  }

  return data;
}

export function login(username, password) {
  return apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export function logout() {
  return apiFetch('/api/auth/logout', { method: 'POST' });
}

export function getMe() {
  return apiFetch('/api/auth/me', { method: 'GET' });
}
