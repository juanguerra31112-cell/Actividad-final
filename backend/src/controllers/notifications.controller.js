const { query } = require('../db/connection');

// GET /api/notifications
const getAll = async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50'
    );
    const unread = rows.filter(n => !n.read).length;
    res.json({ notifications: rows, unread_count: unread });
  } catch (err) { next(err); }
};

// PATCH /api/notifications/:id/read
const markRead = async (req, res, next) => {
  try {
    const { rows } = await query(
      'UPDATE notifications SET read=true WHERE id=$1 RETURNING *',
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Notificación no encontrada.' });
    res.json(rows[0]);
  } catch (err) { next(err); }
};

// PATCH /api/notifications/read-all
const markAllRead = async (req, res, next) => {
  try {
    const { rowCount } = await query('UPDATE notifications SET read=true WHERE read=false');
    res.json({ message: `${rowCount} notificaciones marcadas como leídas.` });
  } catch (err) { next(err); }
};

module.exports = { getAll, markRead, markAllRead };
