const { Pool } = require('pg');
require('dotenv').config();

// En producción (Render) existe DATABASE_URL automáticamente.
// En desarrollo local usamos las variables individuales del .env.
const isProduction = process.env.NODE_ENV === 'production';

const poolConfig = isProduction
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }, // requerido por Render PostgreSQL
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    }
  : {
      host:     process.env.DB_HOST     || 'localhost',
      port:     parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME     || 'arenacore',
      user:     process.env.DB_USER     || 'postgres',
      password: process.env.DB_PASSWORD || '',
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('❌ Error inesperado en el pool de PostgreSQL:', err.message);
});

const query = (text, params) => pool.query(text, params);

const testConnection = async () => {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('✅ PostgreSQL conectado:', res.rows[0].now);
  } catch (err) {
    console.error('❌ No se pudo conectar a PostgreSQL:', err.message);
    process.exit(1);
  }
};

module.exports = { pool, query, testConnection };
