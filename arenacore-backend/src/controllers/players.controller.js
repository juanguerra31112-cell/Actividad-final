const { query } = require('../db/connection');

// GET /api/players  (todos, o filtrados por ?tournament_id=X)
const getAll = async (req, res, next) => {
  try {
    const { tournament_id, search } = req.query;
    let sql = `
      SELECT p.*, t.name AS tournament_name
      FROM players p
      LEFT JOIN tournaments t ON t.id = p.tournament_id
    `;
    const params = [];
    const filters = [];
    if (tournament_id) { params.push(tournament_id); filters.push(`p.tournament_id = $${params.length}`); }
    if (search) {
      params.push(`%${search}%`);
      filters.push(`(p.name ILIKE $${params.length} OR p.email ILIKE $${params.length} OR p.game ILIKE $${params.length})`);
    }
    if (filters.length) sql += ' WHERE ' + filters.join(' AND ');
    sql += ' ORDER BY p.wins DESC, p.registered_at DESC';
    const { rows } = await query(sql, params);
    res.json(rows);
  } catch (err) { next(err); }
};

// GET /api/players/:id
const getOne = async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT p.*, t.name AS tournament_name,
        (SELECT COUNT(*) FROM matches WHERE (player1_id = p.id OR player2_id = p.id) AND status = 'finished')::int AS total_matches
      FROM players p
      LEFT JOIN tournaments t ON t.id = p.tournament_id
      WHERE p.id = $1
    `, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Jugador no encontrado.' });
    res.json(rows[0]);
  } catch (err) { next(err); }
};

// POST /api/players  — registrar jugador en torneo
const register = async (req, res, next) => {
  try {
    const { name, email, game, rank, tournament_id } = req.body;

    // Verificar que el torneo exista y esté en inscripciones
    const { rows: tRows } = await query(
      'SELECT id, status, max_players FROM tournaments WHERE id = $1',
      [tournament_id]
    );
    const torneo = tRows[0];
    if (!torneo) return res.status(404).json({ error: 'Torneo no encontrado.' });
    if (torneo.status !== 'registration') {
      return res.status(400).json({ error: 'El torneo no está aceptando inscripciones.' });
    }

    // Verificar cupo
    const { rows: countRows } = await query(
      'SELECT COUNT(*)::int AS count FROM players WHERE tournament_id = $1',
      [tournament_id]
    );
    if (countRows[0].count >= torneo.max_players) {
      return res.status(400).json({ error: 'El torneo está lleno.' });
    }

    const { rows } = await query(`
      INSERT INTO players (name, email, game, rank, tournament_id)
      VALUES ($1,$2,$3,$4,$5)
      RETURNING *
    `, [name, email, game, rank, tournament_id]);

    // Notificación de nuevo jugador
    await query(
      'INSERT INTO notifications (type, message) VALUES ($1, $2)',
      ['system', `Nuevo jugador inscrito: ${name}`]
    );

    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
};

// DELETE /api/players/:id
const remove = async (req, res, next) => {
  try {
    const { rowCount } = await query('DELETE FROM players WHERE id=$1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Jugador no encontrado.' });
    res.json({ message: 'Jugador eliminado.' });
  } catch (err) { next(err); }
};

module.exports = { getAll, getOne, register, remove };
