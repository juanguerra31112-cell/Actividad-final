// ─── ARENACORE API CLIENT ────────────────────────────────────────────────────
// Reemplaza src/db.js en el frontend cuando el backend esté corriendo.
// Cambia BASE_URL por la URL de tu servidor.

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Token management
const getToken = () => localStorage.getItem('arenacore_token');
const setToken = (t) => localStorage.setItem('arenacore_token', t);
const clearToken = () => localStorage.removeItem('arenacore_token');

// Fetch helper con autenticación
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

// ── API ───────────────────────────────────────────────────────────────────────
export const api = {

  // AUTH
  login: (email, password) =>
    request('/auth/login', { method:'POST', body: JSON.stringify({ email, password }) })
      .then(data => { setToken(data.token); return data; }),
  logout: () => clearToken(),
  me: () => request('/auth/me'),

  // TOURNAMENTS
  getTournaments: (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return request(`/tournaments${params ? '?'+params : ''}`);
  },
  getTournament: (id) => request(`/tournaments/${id}`),
  createTournament: (data) =>
    request('/tournaments', { method:'POST', body: JSON.stringify(data) }),
  updateTournamentStatus: (id, status) =>
    request(`/tournaments/${id}/status`, { method:'PATCH', body: JSON.stringify({ status }) }),
  deleteTournament: (id) =>
    request(`/tournaments/${id}`, { method:'DELETE' }),
  getStats: () => request('/tournaments/stats'),

  // PLAYERS
  getPlayers: (tournament_id) => {
    const params = tournament_id ? `?tournament_id=${tournament_id}` : '';
    return request(`/players${params}`);
  },
  getPlayer: (id) => request(`/players/${id}`),
  registerPlayer: (data) =>
    request('/players', { method:'POST', body: JSON.stringify(data) }),
  deletePlayer: (id) =>
    request(`/players/${id}`, { method:'DELETE' }),

  // MATCHES
  getMatches: (tournament_id) =>
    request(`/matches?tournament_id=${tournament_id}`),
  updateScore: (id, score1, score2) =>
    request(`/matches/${id}/score`, { method:'PATCH', body: JSON.stringify({ score1, score2 }) }),
  setMatchLive: (id) =>
    request(`/matches/${id}/status`, { method:'PATCH', body: JSON.stringify({ status:'live' }) }),

  // NOTIFICATIONS
  getNotifications: () => request('/notifications'),
  markRead: (id) => request(`/notifications/${id}/read`, { method:'PATCH' }),
  markAllRead: () => request('/notifications/read-all', { method:'PATCH' }),
};
