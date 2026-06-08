require('dotenv').config();
const { pool } = require('./connection');
const bcrypt = require('bcryptjs');

const seed = async () => {
  const client = await pool.connect();
  try {
    console.log('🌱 Insertando datos de prueba...');
    await client.query('BEGIN');

    // Limpiar tablas en orden correcto
    await client.query('DELETE FROM notifications');
    await client.query('DELETE FROM matches');
    await client.query('DELETE FROM players');
    await client.query('DELETE FROM tournaments');
    await client.query('DELETE FROM users');

    // Reiniciar secuencias
    for (const t of ['users','tournaments','players','matches','notifications']) {
      await client.query(`ALTER SEQUENCE ${t}_id_seq RESTART WITH 1`);
    }

    // ── Usuario admin ───────────────────────────────────────────────────────
    const hash = await bcrypt.hash('admin123', 10);
    await client.query(`
      INSERT INTO users (name, email, password, role) VALUES
      ('Admin ArenaCore', 'admin@arenacore.com', $1, 'admin')
    `, [hash]);

    // ── Torneos ─────────────────────────────────────────────────────────────
    await client.query(`
      INSERT INTO tournaments (name, game, description, status, format, max_players, prize_pool, start_date, created_by) VALUES
      ('Liga Valorant Medellín', 'Valorant',   'Torneo clasificatorio regional de Valorant.',      'active',       'single_elimination', 8,  '$500.000 COP', '2026-06-10', 1),
      ('FIFA Masters Cup',       'FIFA 25',    'Torneo de FIFA para la comunidad universitaria.',   'registration', 'double_elimination', 16, '$300.000 COP', '2026-06-20', 1),
      ('CS2 Open Series',        'CS2',        'Serie abierta de Counter-Strike 2.',               'finished',     'single_elimination', 8,  '$200.000 COP', '2026-05-15', 1)
    `);

    // ── Jugadores ───────────────────────────────────────────────────────────
    await client.query(`
      INSERT INTO players (name, email, game, rank, tournament_id, wins, losses) VALUES
      ('ElDiablo99',  'diablo@mail.com',  'Valorant', 'Diamante',  1, 12, 3),
      ('SnipeQueen',  'snipe@mail.com',   'Valorant', 'Platino',   1,  8, 5),
      ('TurboAlex',   'turbo@mail.com',   'Valorant', 'Oro',       1,  6, 7),
      ('NightWolf',   'wolf@mail.com',    'Valorant', 'Platino',   1,  9, 4),
      ('CrystaLyte',  'crystal@mail.com', 'Valorant', 'Diamante',  1, 15, 2),
      ('PhantomX',    'phantom@mail.com', 'Valorant', 'Inmortal',  1, 20, 1),
      ('StarDust',    'star@mail.com',    'Valorant', 'Oro',       1,  5, 8),
      ('IronCore',    'iron@mail.com',    'Valorant', 'Platino',   1,  7, 6),
      ('GoalMaster',  'goal@mail.com',    'FIFA 25',  'División 1',2, 18, 3),
      ('TikiTaka',    'tiki@mail.com',    'FIFA 25',  'División 2',2, 10, 7)
    `);

    // ── Partidas del torneo 1 (Liga Valorant) ───────────────────────────────
    await client.query(`
      INSERT INTO matches (tournament_id, round, position, player1_id, player2_id, score1, score2, winner_id, status, played_at) VALUES
      (1, 1, 1, 1, 2, 13,  7, 1, 'finished', NOW() - INTERVAL '2 days'),
      (1, 1, 2, 3, 4,  9, 13, 4, 'finished', NOW() - INTERVAL '2 days'),
      (1, 1, 3, 5, 6, 11, 13, 6, 'finished', NOW() - INTERVAL '1 day'),
      (1, 1, 4, 7, 8, 13,  5, 7, 'finished', NOW() - INTERVAL '1 day'),
      (1, 2, 1, 1, 4, NULL, NULL, NULL, 'live',    NULL),
      (1, 2, 2, 6, 7, NULL, NULL, NULL, 'pending', NULL),
      (1, 3, 1, NULL, NULL, NULL, NULL, NULL, 'pending', NULL)
    `);

    // ── Notificaciones ──────────────────────────────────────────────────────
    await client.query(`
      INSERT INTO notifications (type, message, read) VALUES
      ('match',  'Tu partida en Ronda 2 comienza en 30 min',   false),
      ('result', 'ElDiablo99 venció a SnipeQueen 13-7',        false),
      ('system', 'FIFA Masters Cup abrió inscripciones',       true)
    `);

    await client.query('COMMIT');
    console.log('✅ Seed completado:');
    console.log('   👤 Usuario: admin@arenacore.com / admin123');
    console.log('   🏆 3 torneos | 10 jugadores | 7 partidas | 3 notificaciones');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error en seed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
};

seed().catch(() => process.exit(1));
