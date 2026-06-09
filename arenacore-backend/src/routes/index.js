const router = require('express').Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/error');
const { auth } = require('../middleware/auth');

// Controllers
const authCtrl   = require('../controllers/auth.controller');
const tourCtrl   = require('../controllers/tournaments.controller');
const playCtrl   = require('../controllers/players.controller');
const matchCtrl  = require('../controllers/matches.controller');
const notifCtrl  = require('../controllers/notifications.controller');

// ── AUTH ─────────────────────────────────────────────────────────────────────
router.post('/auth/login',
  [body('email').isEmail(), body('password').notEmpty()], validate,
  authCtrl.login
);
router.post('/auth/register',
  [body('name').notEmpty(), body('email').isEmail(), body('password').isLength({ min: 6 })], validate,
  authCtrl.register
);
router.get('/auth/me', auth, authCtrl.me);

// ── TOURNAMENTS ───────────────────────────────────────────────────────────────
router.get('/tournaments/stats',          tourCtrl.getStats);
router.get('/tournaments',               tourCtrl.getAll);
router.get('/tournaments/:id',           tourCtrl.getOne);
router.post('/tournaments',
  auth,
  [body('name').notEmpty().withMessage('El nombre es requerido'),
   body('game').notEmpty().withMessage('El juego es requerido')], validate,
  tourCtrl.create
);
router.patch('/tournaments/:id/status',  auth, tourCtrl.updateStatus);
router.delete('/tournaments/:id',        auth, tourCtrl.remove);

// ── PLAYERS ───────────────────────────────────────────────────────────────────
router.get('/players',              playCtrl.getAll);
router.get('/players/:id',          playCtrl.getOne);
router.post('/players',
  [body('name').notEmpty(),
   body('email').isEmail(),
   body('tournament_id').isInt()], validate,
  playCtrl.register
);
router.delete('/players/:id', auth, playCtrl.remove);

// ── MATCHES ───────────────────────────────────────────────────────────────────
router.get('/matches',                       matchCtrl.getAll);
router.patch('/matches/:id/score',
  auth,
  [body('score1').isInt({ min: 0 }), body('score2').isInt({ min: 0 })], validate,
  matchCtrl.updateScore
);
router.patch('/matches/:id/status', auth,    matchCtrl.updateStatus);

// ── NOTIFICATIONS ──────────────────────────────────────────────────────────────
router.get('/notifications',               notifCtrl.getAll);
router.patch('/notifications/read-all',    auth, notifCtrl.markAllRead);
router.patch('/notifications/:id/read',    auth, notifCtrl.markRead);

module.exports = router;
