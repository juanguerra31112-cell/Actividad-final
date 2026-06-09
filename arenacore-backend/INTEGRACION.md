# 🔌 Guía de integración Frontend ↔ Backend

## Cómo correr el proyecto completo

Necesitas **dos terminales** abiertas al mismo tiempo:

### Terminal 1 — Backend
```bash
cd arenacore-backend
npm install
cp .env.example .env          # edita con tu password de PostgreSQL
psql -U postgres -c "CREATE DATABASE arenacore;"
npm run db:migrate
npm run db:seed
npm run dev
# ✅ Corre en http://localhost:3001
```

### Terminal 2 — Frontend
```bash
cd arenacore-frontend          # tu carpeta del proyecto React
cp frontend-src/.env.example .env
# .env ya tiene: REACT_APP_API_URL=http://localhost:3001/api
npm install
npm start
# ✅ Corre en http://localhost:3000
```

## Lo que cambió en el frontend

### Antes (simulado en memoria)
```js
// db.js — datos fijos en sessionStorage
export const api = {
  getTournaments: () => loadDB().tournaments,  // síncrono
  createTournament: (data) => { ... }          // síncrono
}
```

### Ahora (backend real)
```js
// db.js — llamadas HTTP reales
export const api = {
  getTournaments: async () => { ... },         // asíncrono con await
  createTournament: async (data) => { ... }    // maneja errores HTTP
}
```

### Cambios clave en views.jsx
- Todos los datos se cargan con `useFetch()` (hook personalizado)
- Hay estados de **loading** con skeleton animado mientras carga
- Hay estados de **error** con botón de reintentar si el backend no responde
- Los formularios tienen estado **saving** (botón deshabilitado mientras guarda)
- Los toasts confirman cada acción exitosa o muestran el error del backend

## Normalización de campos (snake_case ↔ camelCase)
El backend usa snake_case (convención PostgreSQL):
- `max_players`, `prize_pool`, `start_date`, `tournament_id`

El frontend usa camelCase (convención React):
- `maxPlayers`, `prizePool`, `startDate`, `tournamentId`

La función `normalizeTournament()` en `db.js` hace la traducción automáticamente.

## Login (para rutas protegidas)
```js
// El token JWT se guarda en localStorage automáticamente al hacer login
const { token, user } = await api.login('admin@arenacore.com', 'admin123');
// Desde ese momento todas las peticiones incluyen el header Authorization: Bearer <token>
```
