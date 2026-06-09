// ─── ARENACORE API CLIENT ─────────────────────────────────────────────────────
// Reemplaza la base de datos en memoria por llamadas HTTP reales al backend.
// Cambia REACT_APP_API_URL en .env para apuntar a producción.

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// ── Token JWT ─────────────────────────────────────────────────────────────────
const getToken  = () => localStorage.getItem('arenacore_token');
export const setToken  = (t) => localStorage.setItem('arenacore_token', t);
export const clearToken = () => localStorage.removeItem('arenacore_token');

// ── Fetch helper ──────────────────────────────────────────────────────────────
const request = async (path, options = {}) => {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data;
};

// ── Helpers de campo: el backend usa snake_case, el frontend camelCase ─────────
// El backend devuelve max_players, prize_pool, start_date, tournament_id, etc.
// Los normalizamos aquí para no tocar los componentes.
const normalizeTournament = (t) => ({
  ...t,
  maxPlayers:  t.max_players  ?? t.maxPlayers,
  prizePool:   t.prize_pool   ?? t.prizePool,
  startDate:   t.start_date   ?? t.startDate,
  createdAt:   t.created_at   ?? t.createdAt,
  playerCount: t.player_count ?? 0,
});

const normalizePlayer = (p) => ({
  ...p,
  tournamentId:   p.tournament_id  ?? p.tournamentId,
  tournamentName: p.tournament_name,
  registeredAt:  p.registered_at,
});

const normalizeMatch = (m) => ({
  ...m,
  tournamentId: m.tournament_id ?? m.tournamentId,
  // El backend devuelve player1_id / player2_id / winner_id
  player1:      m.player1_id ?? m.player1,
  player2:      m.player2_id ?? m.player2,
  winner:       m.winner_id  ?? m.winner,
  player1Name:  m.player1_name,
  player2Name:  m.player2_name,
  winnerName:   m.winner_name,
});

const normalizeNotif = (n) => ({
  ...n,
  time: n.created_at
    ? new Date(n.created_at).toLocaleTimeString('es-CO', { hour:'2-digit', minute:'2-digit' })
    : n.time,
});

// ─── API PÚBLICA ──────────────────────────────────────────────────────────────
export const api = {

  // ── AUTH ────────────────────────────────────────────────────────────────────
  login: async (email, password) => {
    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(data.token);
    return data;
  },
  logout: () => clearToken(),
  me: () => request('/auth/me'),

  // ── TOURNAMENTS ─────────────────────────────────────────────────────────────
  getTournaments: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const rows = await request(`/tournaments${params ? '?' + params : ''}`);
    return rows.map(normalizeTournament);
  },

  getTournament: async (id) => {
    const t = await request(`/tournaments/${id}`);
    return normalizeTournament(t);
  },

  createTournament: async (data) => {
    // Adaptar camelCase → snake_case para el backend
    const payload = {
      name:        data.name,
      game:        data.game,
      description: data.description,
      format:      data.format,
      max_players: data.maxPlayers ?? data.max_players ?? 8,
      prize_pool:  data.prizePool  ?? data.prize_pool,
      start_date:  data.startDate  ?? data.start_date,
    };
    const t = await request('/tournaments', { method: 'POST', body: JSON.stringify(payload) });
    return normalizeTournament(t);
  },

  updateTournamentStatus: async (id, status) => {
    const t = await request(`/tournaments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return normalizeTournament(t);
  },

  deleteTournament: (id) => request(`/tournaments/${id}`, { method: 'DELETE' }),

  getStats: async () => {
    const s = await request('/tournaments/stats');
    return {
      totalTournaments:    parseInt(s.total_tournaments)    || 0,
      activeTournaments:   parseInt(s.active_tournaments)   || 0,
      openRegistration:    parseInt(s.open_registration)    || 0,
      finishedTournaments: parseInt(s.finished_tournaments) || 0,
      totalPlayers:        parseInt(s.total_players)        || 0,
      matchesPlayed:       parseInt(s.matches_played)       || 0,
      liveMatches:         parseInt(s.live_matches)         || 0,
    };
  },

  // ── PLAYERS ─────────────────────────────────────────────────────────────────
  getPlayers: async (tournamentId) => {
    const params = tournamentId ? `?tournament_id=${tournamentId}` : '';
    const rows = await request(`/players${params}`);
    return rows.map(normalizePlayer);
  },

  getPlayer: async (id) => {
    const p = await request(`/players/${id}`);
    return normalizePlayer(p);
  },

  registerPlayer: async (data) => {
    const payload = {
      name:          data.name,
      email:         data.email,
      game:          data.game,
      rank:          data.rank,
      tournament_id: parseInt(data.tournamentId ?? data.tournament_id),
    };
    const p = await request('/players', { method: 'POST', body: JSON.stringify(payload) });
    return normalizePlayer(p);
  },

  deletePlayer: (id) => request(`/players/${id}`, { method: 'DELETE' }),

  // ── MATCHES ─────────────────────────────────────────────────────────────────
  getMatches: async (tournamentId) => {
    const rows = await request(`/matches?tournament_id=${tournamentId}`);
    return rows.map(normalizeMatch);
  },

  updateScore: async (matchId, score1, score2) => {
    const m = await request(`/matches/${matchId}/score`, {
      method: 'PATCH',
      body: JSON.stringify({ score1: parseInt(score1), score2: parseInt(score2) }),
    });
    return normalizeMatch(m);
  },

  setMatchLive: async (matchId) => {
    const m = await request(`/matches/${matchId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'live' }),
    });
    return normalizeMatch(m);
  },

  // ── NOTIFICATIONS ────────────────────────────────────────────────────────────
  getNotifications: async () => {
    const data = await request('/notifications');
    return {
      notifications: (data.notifications || []).map(normalizeNotif),
      unreadCount:   data.unread_count || 0,
    };
  },

  markRead: (id) => request(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllRead: () => request('/notifications/read-all', { method: 'PATCH' }),

  // ── HELPER: cuenta no-leídas (llamado desde App.jsx) ─────────────────────────
  getUnreadCount: async () => {
    const data = await request('/notifications');
    return data.unread_count || 0;
  },
};
