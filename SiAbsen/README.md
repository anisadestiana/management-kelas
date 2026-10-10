# SiAbsen

Aplikasi fullstack manajemen kelas (nilai & absensi). Repositori ini berisi kerangka awal (skeleton) dengan struktur terpisah untuk backend dan frontend, mengacu pada PRD Aplikasi Manajemen Kelas.

## Struktur

```
SiAbsen/
├─ backend/      # Node.js + Express + Neon PostgreSQL
└─ frontend/     # React (Vite)
```

Pada tahap awal ini tersedia:

- Backend: endpoint `GET /api/health` yang mengembalikan status `OK`.
- Frontend: halaman utama yang memanggil endpoint tersebut dan menampilkan statusnya.

## Menjalankan

### Backend

```bash
cd backend
cp .env.example .env   # isi DATABASE_URL (Neon) bila diperlukan
npm install
npm run dev            # berjalan di http://localhost:3001
```

### Frontend

```bash
cd frontend
npm install
npm run dev            # berjalan di http://localhost:5173
```

Buka http://localhost:5173. Halaman utama akan memanggil `GET /api/health` (di-proxy ke backend) dan menampilkan statusnya.

## Stack

- Backend: Node.js, Express, `@neondatabase/serverless` (driver PostgreSQL Neon), dotenv, cors, helmet
- Frontend: React, Vite
- Database: PostgreSQL di Neon (pooled connection, SSL)
