// src/lib/csv.js — Parser CSV minimal untuk impor data (tanpa dependency).
//
// Mendukung: pemisah koma, baris berheader, nilai ber-kutip ganda ("...")
// dengan escape kutip ("") dan koma di dalam kutip. Memangkas spasi pada nilai
// tak-berkutip. Mengabaikan baris yang seluruhnya kosong. Mendukung newline
// \n maupun \r\n. Cukup untuk impor siswa (NIS/nama/kelas), bukan parser CSV
// RFC-lengkap untuk segala kasus.

/** Parse satu baris CSV menjadi array sel. */
function parseLine(line) {
  const cells = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i += 1; // lewati kutip ganda (escape)
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      cells.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  cells.push(cur);
  return cells.map((c) => c.trim());
}

/**
 * Parse teks CSV menjadi array objek, memakai baris pertama sebagai header.
 * Mengembalikan { header: string[], rows: Array<{ data, lineNumber }> }.
 * lineNumber adalah nomor baris di file (1-based, termasuk header).
 */
export function parseCsv(text) {
  if (typeof text !== 'string' || text.trim() === '') {
    return { header: [], rows: [] };
  }

  const rawLines = text.split(/\r?\n/);
  let header = null;
  const rows = [];

  for (let i = 0; i < rawLines.length; i += 1) {
    const line = rawLines[i];
    // Lewati baris yang sepenuhnya kosong (hanya spasi/koma kosong).
    if (line.trim() === '') continue;

    const cells = parseLine(line);

    if (!header) {
      header = cells.map((h) => h.toLowerCase());
      continue;
    }

    const data = {};
    header.forEach((key, idx) => {
      data[key] = cells[idx] !== undefined ? cells[idx] : '';
    });
    rows.push({ data, lineNumber: i + 1 });
  }

  return { header: header || [], rows };
}
