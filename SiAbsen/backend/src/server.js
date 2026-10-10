import 'dotenv/config';
import app from './app.js';

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`SiAbsen backend berjalan di http://localhost:${PORT}`);
  console.log(`Cek kesehatan: http://localhost:${PORT}/api/health`);
});
