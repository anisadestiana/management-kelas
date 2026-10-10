# Management Kelas

Monorepo untuk **SiAbsen** — aplikasi web manajemen kelas (nilai & absensi) untuk satu guru, dengan dashboard laporan dan insight AI. Lihat kebutuhan lengkap di [PRD-Manajemen-Kelas.md](PRD-Manajemen-Kelas.md).

## Struktur Repo

```
management kelas/
├─ PRD-Manajemen-Kelas.md   # Product Requirements Document (acuan utama)
├─ SiAbsen/                 # Aplikasi fullstack
│  ├─ backend/             # Node.js + Express + Neon PostgreSQL
│  └─ frontend/            # React + Vite
└─ .kiro/                  # Konfigurasi & steering Kiro
```

## Mulai Cepat

Petunjuk menjalankan backend dan frontend ada di [SiAbsen/README.md](SiAbsen/README.md).

Ringkasnya:

```bash
# Backend
cd SiAbsen/backend
cp .env.example .env   # isi DATABASE_URL (Neon)
npm install
npm run dev            # http://localhost:3001

# Frontend (terminal terpisah)
cd SiAbsen/frontend
npm install
npm run dev            # http://localhost:5173
```

## Stack

- **Backend**: Node.js >= 22 (ESM), Express, Neon PostgreSQL, zod, JWT, bcrypt
- **Frontend**: React 18, Vite, React Router
- **Database**: PostgreSQL (Neon, pooled + SSL)

## Status

V1 dalam pengembangan bertahap. Fitur di luar cakupan V1 tercantum di PRD bagian "Di Luar Cakupan".
