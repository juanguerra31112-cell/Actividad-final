#!/bin/sh
# ─── ARENACORE — Script de inicio en producción ───────────────────────────────
# Render ejecuta este script al hacer deploy.
# Corre las migraciones y luego arranca el servidor.

set -e  # Detener si cualquier comando falla

echo ""
echo "╔══════════════════════════════════════╗"
echo "║   🎮  ArenaCore — Deploy en Render   ║"
echo "╚══════════════════════════════════════╝"
echo ""

# 1. Correr migraciones (crea las tablas si no existen)
echo "🔄 Corriendo migraciones..."
node src/db/migrate.js
echo "✅ Migraciones completadas"

# 2. Seed solo si es el primer deploy (la tabla users estaría vacía)
echo "🌱 Verificando datos iniciales..."
node -e "
const { pool } = require('./src/db/connection');
pool.query('SELECT COUNT(*) FROM users')
  .then(r => {
    if (parseInt(r.rows[0].count) === 0) {
      console.log('Primera vez: corriendo seed...');
      pool.end();
      require('child_process').execSync('node src/db/seed.js', { stdio: 'inherit' });
    } else {
      console.log('Datos ya existen, omitiendo seed.');
      pool.end();
    }
  })
  .catch(() => {
    // Si falla (tabla no existe aún), el migrate ya la creó — ignorar
    pool.end();
  });
" 2>/dev/null || true

# 3. Iniciar el servidor
echo "🚀 Iniciando servidor..."
node src/index.js
