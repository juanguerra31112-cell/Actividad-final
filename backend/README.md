# 🎮 ArenaCore — Backend API

API REST construida con **Node.js + Express + PostgreSQL** para la plataforma de gestión de torneos de videojuegos.

---

## 📋 Requisitos previos

Antes de empezar instala:

| Herramienta | Versión mínima | Descarga |
|------------|---------------|---------|
| Node.js    | 18+           | https://nodejs.org |
| PostgreSQL  | 14+           | https://www.postgresql.org/download |
| npm        | 8+            | (viene con Node.js) |

---

## 🚀 Instalación paso a paso

### 1. Clonar / ubicarse en la carpeta del proyecto
```bash
cd arenacore-backend
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
```bash
# Copia el archivo de ejemplo
cp .env.example .env

# Abre .env y edita estos valores con los de tu PostgreSQL local:
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=arenacore
# DB_USER=postgres
# DB_PASSWORD=tu_password_aqui
```

### 4. Crear la base de datos en PostgreSQL
```bash
# Abre psql (consola de PostgreSQL)
psql -U postgres

# Dentro de psql, ejecuta:
CREATE DATABASE arenacore;
\q
```

### 5. Crear las tablas (migración)
```bash
npm run db:migrate
```

### 6. Cargar datos de prueba (seed)
```bash
npm run db:seed
# Crea: 1 admin, 3 torneos, 10 jugadores, 7 partidas, 3 notificaciones
```

### 7. Iniciar el servidor
```bash
# Modo desarrollo (auto-reload con nodemon)
npm run dev

# Modo producción
npm start
```

El servidor arranca en: **http://localhost:3001**

---

## 🔑 Credenciales de prueba

| Campo    | Valor                  |
|---------|------------------------|
| Email   | admin@arenacore.com    |
| Password| admin123               |

---

## 📡 Endpoints de la API

### Autenticación
| Método | Ruta            | Auth | Descripción         |
|--------|----------------|------|---------------------|
| POST   | /api/auth/login    | ❌   | Login, devuelve JWT |
| POST   | /api/auth/register | ❌   | Registrar admin     |
| GET    | /api/auth/me       | ✅   | Info del usuario    |

### Torneos
| Método | Ruta                          | Auth | Descripción             |
|--------|-------------------------------|------|-------------------------|
| GET    | /api/tournaments              | ❌   | Listar todos            |
| GET    | /api/tournaments/stats        | ❌   | Estadísticas globales   |
| GET    | /api/tournaments/:id          | ❌   | Detalle de un torneo    |
| POST   | /api/tournaments              | ✅   | Crear torneo            |
| PATCH  | /api/tournaments/:id/status   | ✅   | Cambiar estado          |
| DELETE | /api/tournaments/:id          | ✅   | Eliminar torneo         |

### Jugadores
| Método | Ruta              | Auth | Descripción           |
|--------|------------------|------|-----------------------|
| GET    | /api/players      | ❌   | Listar (filtrar por ?tournament_id=X) |
| GET    | /api/players/:id  | ❌   | Detalle jugador       |
| POST   | /api/players      | ❌   | Inscribir jugador     |
| DELETE | /api/players/:id  | ✅   | Eliminar jugador      |

### Partidas
| Método | Ruta                      | Auth | Descripción             |
|--------|--------------------------|------|-------------------------|
| GET    | /api/matches              | ❌   | Listar (?tournament_id=X)|
| PATCH  | /api/matches/:id/score    | ✅   | Registrar resultado     |
| PATCH  | /api/matches/:id/status   | ✅   | Poner en vivo           |

### Notificaciones
| Método | Ruta                          | Auth | Descripción             |
|--------|-------------------------------|------|-------------------------|
| GET    | /api/notifications            | ❌   | Listar todas            |
| PATCH  | /api/notifications/:id/read   | ✅   | Marcar una como leída   |
| PATCH  | /api/notifications/read-all   | ✅   | Marcar todas como leídas|

---

## 🔌 Conectar el frontend React

Reemplaza `src/db.js` en el frontend por `src/api.client.js` de este proyecto.

Crea un archivo `.env` en la raíz del frontend:
```
REACT_APP_API_URL=http://localhost:3001/api
```

---

## 🧪 Probar la API con curl

```bash
# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@arenacore.com","password":"admin123"}'

# Listar torneos
curl http://localhost:3001/api/tournaments

# Jugadores del torneo 1
curl http://localhost:3001/api/players?tournament_id=1

# Estadísticas
curl http://localhost:3001/api/tournaments/stats
```

---

## 🗂 Estructura del proyecto

```
arenacore-backend/
├── src/
│   ├── index.js              # Servidor Express principal
│   ├── db/
│   │   ├── connection.js     # Pool de conexión PostgreSQL
│   │   ├── migrate.js        # Crea las tablas
│   │   └── seed.js           # Datos de prueba
│   ├── middleware/
│   │   ├── auth.js           # Verificación JWT
│   │   └── error.js          # Manejo global de errores
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── tournaments.controller.js
│   │   ├── players.controller.js
│   │   ├── matches.controller.js
│   │   └── notifications.controller.js
│   ├── routes/
│   │   └── index.js          # Todas las rutas agrupadas
│   └── api.client.js         # Cliente para el frontend React
├── .env.example
├── package.json
└── README.md
```

---

## 🌐 Deploy en producción (Render / Railway)

### Render (gratis)
1. Sube el código a GitHub
2. En Render crea un **Web Service** apuntando al repo
3. Build command: `npm install`
4. Start command: `npm start`
5. Crea una **PostgreSQL database** en Render y copia la `DATABASE_URL`
6. En las variables de entorno añade `DATABASE_URL` y descomenta esa línea en `connection.js`

### Railway (gratis con límites)
1. `railway init` en la carpeta del proyecto
2. `railway add --plugin postgresql`
3. `railway up`
4. Railway provee `DATABASE_URL` automáticamente

---

## 📐 Modelo de datos (ERD simplificado)

```
users ──────────── tournaments ──── players
                        │               │
                        └──── matches ──┘
                        
                   notifications (global)
```

---

*ArenaCore Backend v1.0.0 — Sprint 1 completado*
