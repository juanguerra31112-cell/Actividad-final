require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const { testConnection } = require('./db/connection');
const routes   = require('./routes');
const { errorHandler } = require('./middleware/error');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Middlewares globales ──────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger de peticiones en desarrollo
if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    console.log(`→ ${req.method} ${req.path}`);
    next();
  });
}

// ── Rutas ─────────────────────────────────────────────────────────────────────
app.use('/api', routes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', app: 'ArenaCore API', version: '1.0.0', timestamp: new Date().toISOString() });
});

// Ruta no encontrada
app.use((_req, res) => res.status(404).json({ error: 'Ruta no encontrada.' }));

// Handler global de errores (debe ir al final)
app.use(errorHandler);

// ── Iniciar servidor ──────────────────────────────────────────────────────────
const start = async () => {
  await testConnection();
  app.listen(PORT, () => {
    console.log('');
    console.log('  ╔══════════════════════════════════════╗');
    console.log('  ║   🎮  ArenaCore API  v1.0.0          ║');
    console.log(`  ║   http://localhost:${PORT}/api          ║`);
    console.log('  ╚══════════════════════════════════════╝');
    console.log('');
    console.log('  Endpoints disponibles:');
    console.log('  POST   /api/auth/login');
    console.log('  GET    /api/tournaments');
    console.log('  GET    /api/players?tournament_id=1');
    console.log('  GET    /api/matches?tournament_id=1');
    console.log('  GET    /api/notifications');
    console.log('  GET    /health');
    console.log('');
  });
};

start();
