require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const { testConnection } = require('./db/connection');
const routes   = require('./routes');
const { errorHandler } = require('./middleware/error');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── CORS: acepta localhost en dev y la URL de Render en producción ────────────
const allowedOrigins = [
  'http://localhost:3000',
  process.env.CLIENT_URL,        // URL del frontend en Render (estática)
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    // Permite peticiones sin origin (curl, Postman, mobile)
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS bloqueado para: ${origin}`));
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    console.log(`→ ${req.method} ${req.path}`);
    next();
  });
}

// ── Rutas ─────────────────────────────────────────────────────────────────────
app.use('/api', routes);

// Health check — Render lo usa para verificar que el servicio está vivo
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    app: 'ArenaCore API',
    version: '1.0.0',
    env: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

app.use((_req, res) => res.status(404).json({ error: 'Ruta no encontrada.' }));
app.use(errorHandler);

// ── Iniciar ───────────────────────────────────────────────────────────────────
const start = async () => {
  await testConnection();
  app.listen(PORT, '0.0.0.0', () => {
    console.log('');
    console.log('  ╔══════════════════════════════════════╗');
    console.log('  ║   🎮  ArenaCore API  v1.0.0          ║');
    console.log(`  ║   Puerto: ${PORT}                       ║`);
    console.log(`  ║   Env:    ${(process.env.NODE_ENV || 'development').padEnd(12)}            ║`);
    console.log('  ╚══════════════════════════════════════╝');
    console.log('');
  });
};

start();
