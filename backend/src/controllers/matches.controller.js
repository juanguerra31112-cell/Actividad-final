const { query } = require('../db/connection');

// GET /api/matches?tournament_id=X
const getAll = async (req, res, next) => {
  try {
    const { tournament_id } = req.query;
    if (!tournament_id) return res.status(400).json({ error: 'Falta el parámetro tournament_id.' });
    const { rows } = await query(`
      SELECT
        m.*,
        p1.name AS player1_name, p1.rank AS player1_rank,
        p2.name AS player2_name, p2.rank AS player2_rank,
        pw.name AS winner_name
      FROM matches m
      LEFT JOIN players p1 ON p1.id = m.player1_id
      LEFT JOIN players p2 ON p2.id = m.player2_id
      LEFT JOIN players pw ON pw.id = m.winner_id
      WHERE m.tournament_id = $1
      ORDER BY m.round ASC, m.position ASC
    `, [tournament_id]);
    res.json(rows);
  } catch (err) { next(err); }
};

// PATCH /api/matches/:id/score  — registrar resultado
const updateScore = async (req, res, next) => {
  try {
    const { score1, score2 } = req.body;
    if (score1 === score2) return res.status(400).json({ error: 'No puede haber empate en eliminación.' });

    // Obtener la partida actual
    const { rows: mRows } = await query('SELECT * FROM matches WHERE id=$1', [req.params.id]);
    const match = mRows[0];
    if (!match) return res.status(404).json({ error: 'Partida no encontrada.' });
    if (!match.player1_id || !match.player2_id) {
      return res.status(400).json({ error: 'La partida aún no tiene ambos jugadores asignados.' });
    }
    if (match.status === 'finished') {
      return res.status(400).json({ error: 'Esta partida ya tiene resultado registrado.' });
    }

    const winner_id = score1 > score2 ? match.player1_id : match.player2_id;
    const loser_id  = score1 > score2 ? match.player2_id : match.player1_id;

    // Actualizar partida
    const { rows } = await query(`
      UPDATE matches
      SET score1=$1, score2=$2, winner_id=$3, status='finished', played_at=NOW()
      WHERE id=$4
      RETURNING *
    `, [score1, score2, winner_id, req.params.id]);

    // Actualizar stats del jugador ganador y perdedor
    await query('UPDATE players SET wins = wins + 1 WHERE id=$1', [winner_id]);
    await query('UPDATE players SET losses = losses + 1 WHERE id=$1', [loser_id]);

    // Obtener info de ambos jugadores para la notificación
    const { rows: pRows } = await query(
      'SELECT id, name FROM players WHERE id = ANY($1)',
      [[winner_id, loser_id]]
    );
    const winner = pRows.find(p => p.id === winner_id);
    const loser  = pRows.find(p => p.id === loser_id);

    // Notificación de resultado
    await query(
      'INSERT INTO notifications (type, message) VALUES ($1,$2)',
      ['result', `${winner.name} venció a ${loser.name} ${score1 > score2 ? score1+'-'+score2 : score2+'-'+score1}`]
    );

    // Avanzar ganador a la siguiente ronda si existe slot
    const nextRound = match.round + 1;
    const nextPos   = Math.ceil(match.position / 2);
    const { rows: nextSlot } = await query(`
      SELECT * FROM matches
      WHERE tournament_id=$1 AND round=$2 AND position=$3
    `, [match.tournament_id, nextRound, nextPos]);

    if (nextSlot[0]) {
      const slot = nextSlot[0];
      const field = slot.player1_id ? 'player2_id' : 'player1_id';
      await query(`UPDATE matches SET ${field}=$1 WHERE id=$2`, [winner_id, slot.id]);
    }

    res.json(rows[0]);
  } catch (err) { next(err); }
};

// PATCH /api/matches/:id/status  — poner en live
const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['pending','live'].includes(status)) {
      return res.status(400).json({ error: 'Solo puedes cambiar a: pending, live' });
    }
    const { rows } = await query(
      'UPDATE matches SET status=$1 WHERE id=$2 AND status != \'finished\' RETURNING *',
      [status, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Partida no encontrada o ya finalizada.' });

    if (status === 'live') {
      const { rows: pRows } = await query(
        'SELECT name FROM players WHERE id = ANY($1)',
        [[rows[0].player1_id, rows[0].player2_id]]
      );
      const names = pRows.map(p => p.name);
      await query(
        'INSERT INTO notifications (type, message) VALUES ($1,$2)',
        ['match', `¡Partida en vivo! ${names[0] || '?'} vs ${names[1] || '?'} — Ronda ${rows[0].round}`]
      );
    }
    res.json(rows[0]);
  } catch (err) { next(err); }
};

module.exports = { getAll, updateScore, updateStatus };
