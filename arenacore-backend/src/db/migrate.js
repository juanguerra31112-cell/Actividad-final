require('dotenv').config();
const { pool } = require('./connection');

const migrate = async () => {
  const client = await pool.connect();
  try {
    console.log('🔄 Ejecutando migraciones...');
    await client.query('BEGIN');

    // ── Tabla: usuarios (admins/organizadores) ──────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id          SERIAL PRIMARY KEY,
        name        VARCHAR(100) NOT NULL,
        email       VARCHAR(150) UNIQUE NOT NULL,
        password    VARCHAR(255) NOT NULL,
        role        VARCHAR(20) DEFAULT 'admin' CHECK (role IN ('admin','organizer')),
        created_at  TIMESTAMP DEFAULT NOW()
      );
    `);

    // ── Tabla: torneos ──────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS tournaments (
        id           SERIAL PRIMARY KEY,
        name         VARCHAR(150) NOT NULL,
        game         VARCHAR(100) NOT NULL,
        description  TEXT,
        status       VARCHAR(30) DEFAULT 'registration'
                     CHECK (status IN ('registration','active','finished','cancelled')),
        format       VARCHAR(30) DEFAULT 'single_elimination'
                     CHECK (format IN ('single_elimination','double_elimination','round_robin')),
        max_players  INTEGER DEFAULT 8 CHECK (max_players IN (4,8,16,32)),
        prize_pool   VARCHAR(100),
        start_date   DATE,
        created_by   INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at   TIMESTAMP DEFAULT NOW(),
        updated_at   TIMESTAMP DEFAULT NOW()
      );
    `);

    // ── Tabla: jugadores ────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS players (
        id            SERIAL PRIMARY KEY,
        name          VARCHAR(100) NOT NULL,
        email         VARCHAR(150) NOT NULL,
        game          VARCHAR(100),
        rank          VARCHAR(50),
        tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE,
        wins          INTEGER DEFAULT 0,
        losses        INTEGER DEFAULT 0,
        registered_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // ── Tabla: partidas ─────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS matches (
        id            SERIAL PRIMARY KEY,
        tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE NOT NULL,
        round         INTEGER NOT NULL,
        position      INTEGER DEFAULT 0,
        player1_id    INTEGER REFERENCES players(id) ON DELETE SET NULL,
        player2_id    INTEGER REFERENCES players(id) ON DELETE SET NULL,
        score1        INTEGER,
        score2        INTEGER,
        winner_id     INTEGER REFERENCES players(id) ON DELETE SET NULL,
        status        VARCHAR(20) DEFAULT 'pending'
                      CHECK (status IN ('pending','live','finished')),
        played_at     TIMESTAMP,
        created_at    TIMESTAMP DEFAULT NOW()
      );
    `);

    // ── Tabla: notificaciones ───────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id         SERIAL PRIMARY KEY,
        type       VARCHAR(30) DEFAULT 'system'
                   CHECK (type IN ('match','result','system')),
        message    TEXT NOT NULL,
        read       BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // ── Índices para performance ────────────────────────────────────────────
    await client.query(`CREATE INDEX IF NOT EXISTS idx_players_tournament ON players(tournament_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_matches_tournament ON matches(tournament_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_matches_status     ON matches(status);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_notifs_read        ON notifications(read);`);

    // ── Trigger: actualizar updated_at automáticamente en tournaments ───────
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
      $$ LANGUAGE plpgsql;
    `);
    await client.query(`
      DROP TRIGGER IF EXISTS trg_tournaments_updated ON tournaments;
      CREATE TRIGGER trg_tournaments_updated
        BEFORE UPDATE ON tournaments
        FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    `);

    await client.query('COMMIT');
    console.log('✅ Migraciones completadas exitosamente.');
    console.log('   Tablas creadas: users, tournaments, players, matches, notifications');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error en migración:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
};

migrate().catch(() => process.exit(1));
