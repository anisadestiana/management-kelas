import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getMe, login as apiLogin, logout as apiLogout, ApiError } from '../lib/api.js';

const AuthContext = createContext(null);

/**
 * Menyediakan state auth global.
 * - Saat mount: panggil GET /api/auth/me untuk memulihkan sesi (user dengan
 *   cookie valid tetap login setelah refresh).
 * - login(username, password): POST /api/auth/login, simpan user yang dikembalikan.
 * - logout(): POST /api/auth/logout, bersihkan state.
 * Semua request memakai credentials:'include' (lihat lib/api.js).
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let aktif = true;
    (async () => {
      try {
        const data = await getMe();
        if (aktif) setUser(data?.user ?? null);
      } catch (err) {
        // 401 = belum login; itu bukan error yang perlu ditampilkan.
        if (aktif && !(err instanceof ApiError && err.status === 401)) {
          // Error jaringan/lainnya: tetap anggap belum login.
          setUser(null);
        }
        if (aktif) setUser((prev) => prev ?? null);
      } finally {
        if (aktif) setLoading(false);
      }
    })();
    return () => {
      aktif = false;
    };
  }, []);

  const login = useCallback(async (username, password) => {
    const data = await apiLogin(username, password);
    setUser(data?.user ?? null);
    return data?.user ?? null;
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } finally {
      setUser(null);
    }
  }, []);

  const value = { user, loading, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth harus dipakai di dalam <AuthProvider>');
  }
  return ctx;
}
