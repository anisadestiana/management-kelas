// Tujuan landing per peran. Hanya ada dua peran: guru & siswa.
export function landingPath(user) {
  if (!user) return '/login';
  return user.role === 'guru' ? '/guru' : '/siswa';
}
