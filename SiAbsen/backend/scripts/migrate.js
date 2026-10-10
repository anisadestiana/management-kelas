// scripts/migrate.js — Runner migrasi SiAbsen (berbasis Pool).
//
// Invariant idempotensi:
//   Setiap file .sql dijalankan sebagai SATU pool.query (satu batch simple-query),
//   yang berarti satu transaksi implisit: bila ada statement yang gagal di tengah
//   file, seluruh file di-rollback. Semua statement di dalam file ditulis idempotent
//   (CREATE ... IF NOT EXISTS, enum dijaga DO $$ ... EXCEPTION WHEN duplicate_object),
//   sehingga menjalankan ulang seluruh file aman dan tidak merusak data.
//
// Catatan driver: memakai Pool dari @neondatabase/serverless (BUKAN HTTP neon()),
// karena neon() mengeksekusi satu statement per panggilan sehingga tidak dapat
// menjalankan blok DO $$ ... $$ / banyak statement sekaligus. Pool memakai WebSocket
// global bawaan Node >=22 (lihat engines di package.json), jadi tidak perlu dependency ws.

import 'dotenv/config';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Pool } from '@neondatabase/serverless';

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, '..', 'migrations');

const connectionString = process.env.DATABASE_URL_DIRECT || process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL_DIRECT atau DATABASE_URL belum diatur');
  process.exit(1);
}

function listMigrationFiles() {
  let entries;
  try {
    entries = readdirSync(migrationsDir);
  } catch {
    return [];
  }
  return entries.filter((f) => f.endsWith('.sql')).sort();
}

async function run() {
  const files = listMigrationFiles();

  if (files.length === 0) {
    console.log('Tidak ada file migrasi ditemukan');
    process.exit(0);
  }

  const pool = new Pool({ connectionString });

  for (const file of files) {
    const sqlText = readFileSync(join(migrationsDir, file), 'utf8');
    console.log(`Menjalankan migrasi: ${file}`);
    try {
      await pool.query(sqlText);
    } catch (err) {
      console.error(`Gagal menjalankan migrasi ${file}:`, err);
      await pool.end();
      process.exit(1);
    }
  }

  await pool.end();
  console.log('Migrasi selesai');
}

run();
