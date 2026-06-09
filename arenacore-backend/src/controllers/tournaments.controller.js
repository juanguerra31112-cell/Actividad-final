const { query } = require('../db/connection');

// GET /api/tournaments
const getAll = async (req, res, next) => {
  try {
    const { status, game } = req.query;
    let sql = `
      SELECT t.*,
        COUNT(DISTINCT p.id)::int AS player_count,
        COUNT(DISTINCT m.id)::int AS match_count
      FROM tournaments t
      LEFT JOIN players p ON p.tournament_id = t.id
      LEFT JOIN matches  m ON m.tournament_id = t.id
    `;
    const params = [];
    const filters = [];
    if (status) { params.push(status); filters.push(`t.status = $${params.length}`); }
    if (game)   { params.push(`%${game}%`); filters.push(`t.game ILIKE $${params.length}`); }
    if (filters.length) sql += ' WHERE ' + filters.join(' AND ');
    sql += ' GROUP BY t.id ORDER BY t.created_at DESC';
    const { rows } = await query(sql, params);
    res.json(rows);
  } catch (err) { next(err); }
};

// GET /api/tournaments/:id
const getOne = async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT t.*,
        COUNT(DISTINCT p.id)::int AS player_count,
        COUNT(DISTINCT m.id)::int AS match_count,
        COUNT(DISTINCT CASE WHEN m.status = 'finished' THEN m.id END)::int AS matches_finished
      FROM tournaments t
      LEFT JOIN players p ON p.tournament_id = t.id
      LEFT JOIN matches  m ON m.tournament_id = t.id
      WHERE t.id = $1
      GROUP BY t.id
    `, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Torneo no encontrado.' });
    res.json(rows[0]);
  } catch (err) { next(err); }
};

// POST /api/tournaments
const create = async (req, res, next) => {
  try {
    const { name, game, description, format, max_players, prize_pool, start_date } = req.body;
    const { rows } = await query(`
      INSERT INTO tournaments (name, game, description, format, max_players, prize_pool, start_date, created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING *
    `, [name, game, description, format || 'single_elimination', max_players || 8, prize_pool, start_date, req.user?.id || null]);
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
};

// PATCH /api/tournaments/:id/status
const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowed = ['registration','active','finished','cancelled'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: `Estado inválido. Usa: ${allowed.join(', ')}` });
    }
    const { rows } = await query(
      'UPDATE tournaments SET status=$1 WHERE id=$2 RETURNING *',
      [status, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Torneo no encontrado.' });

    // Notificación automática al activar
    if (status === 'active') {
      await query(
        'INSERT INTO notifications (type, message) VALUES ($1, $2)',
        ['system', `El torneo "${rows[0].name}" ha comenzado. ¡Que empiece el juego!`]
      );
    }
    res.json(rows[0]);
  } catch (err) { next(err); }
};

// DELETE /api/tournaments/:id
const remove = async (req, res, next) => {
  try {
    const { rowCount } = await query('DELETE FROM tournaments WHERE id=$1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Torneo no encontrado.' });
    res.json({ message: 'Torneo eliminado.' });
  } catch (err) { next(err); }
};

// GET /api/tournaments/stats
const getStats = async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT
        COUNT(*)                                                   AS total_tournaments,
        COUNT(*) FILTER (WHERE status = 'active')                  AS active_tournaments,
        COUNT(*) FILTER (WHERE status = 'registration')            AS open_registration,
        COUNT(*) FILTER (WHERE status = 'finished')                AS finished_tournaments,
        (SELECT COUNT(*) FROM players)::int                        AS total_players,
        (SELECT COUNT(*) FROM matches WHERE status = 'finished')::int AS matches_played,
        (SELECT COUNT(*) FROM matches WHERE status = 'live')::int  AS live_matches
      FROM tournaments
    `);
    res.json(rows[0]);
  } catch (err) { next(err); }
};

module.exports = { getAll, getOne, create, updateStatus, remove, getStats };
