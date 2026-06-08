# 🚀 Deploy en Render — ArenaCore

## ¿Por qué Render?

| Feature | Render | Railway |
|--------|--------|---------|
| Frontend estático | ✅ Gratis permanente | ✅ $5/mes crédito |
| Backend Node.js | ✅ Gratis (duerme tras 15min) | ✅ $5/mes crédito |
| PostgreSQL | ✅ Gratis 90 días | ✅ Incluido en crédito |
| Dominios custom | ✅ Gratis | ✅ Gratis |
| Deploy automático desde GitHub | ✅ | ✅ |

**Render es la opción recomendada** para el proyecto académico porque el tier gratuito cubre los 3 servicios sin tarjeta de crédito obligatoria.

---

## 📋 Prerequisitos

- Cuenta en [GitHub](https://github.com) (gratuita)
- Cuenta en [Render](https://render.com) (gratuita, puedes entrar con GitHub)
- El código subido a un repositorio de GitHub

---

## PASO 1 — Subir el código a GitHub

### Estructura de repositorios recomendada
Puedes usar **1 repo con dos carpetas** (monorepo) o **2 repos separados**. Recomendamos monorepo:

```
arenacore/
├── backend/     ← contenido de arenacore-backend/
└── frontend/    ← contenido de la carpeta React
```

### Comandos Git
```bash
# En la carpeta raíz del proyecto
git init
git add .
git commit -m "feat: ArenaCore full stack inicial"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/arenacore.git
git push -u origin main
```

> ⚠️ Asegúrate de que el `.gitignore` excluya `node_modules/` y `.env`

---

## PASO 2 — Crear la base de datos PostgreSQL en Render

1. Entra a [dashboard.render.com](https://dashboard.render.com)
2. Clic en **"New +"** → **"PostgreSQL"**
3. Configura:
   - **Name:** `arenacore-db`
   - **Database:** `arenacore`
   - **User:** `arenacore_user`
   - **Region:** Oregon (US West) — la más cercana con tier gratis
   - **Plan:** `Free`
4. Clic en **"Create Database"**
5. Espera ~2 minutos. Cuando esté listo, copia la **"Internal Database URL"** — la necesitarás en el paso 3.

---

## PASO 3 — Deploy del Backend (Web Service)

1. En el dashboard de Render: **"New +"** → **"Web Service"**
2. Conecta tu repositorio de GitHub → selecciona `arenacore`
3. Configura:
   - **Name:** `arenacore-api`
   - **Root Directory:** `backend` (si usas monorepo)
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `sh start.sh`
   - **Plan:** `Free`

4. En la sección **"Environment Variables"** agrega:

   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `PORT` | `3001` |
   | `JWT_SECRET` | *(cualquier string largo aleatorio, ej: `arenacore_jwt_2026_xK9mP3qL`)* |
   | `JWT_EXPIRES_IN` | `7d` |
   | `DATABASE_URL` | *(pega la Internal Database URL del paso 2)* |
   | `CLIENT_URL` | `https://arenacore-frontend.onrender.com` *(la cambias después)* |

5. Clic en **"Create Web Service"**
6. Render instalará dependencias, correrá `start.sh` (migraciones + seed + servidor)
7. En ~3-5 minutos verás en los logs: `🎮 ArenaCore API v1.0.0`
8. Copia la URL del servicio, algo como: `https://arenacore-api.onrender.com`

### Verificar que funciona
```bash
curl https://arenacore-api.onrender.com/health
# Respuesta esperada: {"status":"ok","app":"ArenaCore API","version":"1.0.0"}

curl https://arenacore-api.onrender.com/api/tournaments
# Respuesta esperada: array de torneos del seed
```

---

## PASO 4 — Deploy del Frontend (Static Site)

1. En Render: **"New +"** → **"Static Site"**
2. Conecta el mismo repositorio → selecciona `arenacore`
3. Configura:
   - **Name:** `arenacore-frontend`
   - **Root Directory:** `frontend` (si usas monorepo)
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `build`
   - **Plan:** `Free`

4. En **"Environment Variables"** agrega:

   | Key | Value |
   |-----|-------|
   | `REACT_APP_API_URL` | `https://arenacore-api.onrender.com/api` |

5. En **"Redirects/Rewrites"** agrega:
   - **Source:** `/*`
   - **Destination:** `/index.html`
   - **Action:** `Rewrite`
   *(esto es necesario para que React Router funcione con recarga de página)*

6. Clic en **"Create Static Site"**
7. En ~2-3 minutos el frontend estará en: `https://arenacore-frontend.onrender.com`

---

## PASO 5 — Actualizar CORS en el backend

Una vez tengas la URL del frontend, actualiza la variable de entorno en el backend:

1. En Render, entra al servicio `arenacore-api`
2. Ve a **"Environment"**
3. Cambia `CLIENT_URL` por la URL real del frontend: `https://arenacore-frontend.onrender.com`
4. Render re-desplegará automáticamente

---

## ✅ Resultado final

| Servicio | URL |
|---------|-----|
| Frontend | `https://arenacore-frontend.onrender.com` |
| Backend API | `https://arenacore-api.onrender.com/api` |
| Health check | `https://arenacore-api.onrender.com/health` |

---

## ⚠️ Limitaciones del tier gratuito

| Limitación | Detalle |
|-----------|---------|
| Backend "duerme" | Tras 15 min sin tráfico, la primera petición tarda ~30-60 segundos en despertar |
| PostgreSQL gratis | Disponible solo 90 días, luego hay que upgradear ($7/mes) o exportar datos |
| Frontend | **Sin límite de tiempo** — los static sites son gratuitos permanentemente en Render |

### Solución al "sueño" del backend (opcional)
Para evitar que el backend se duerma, puedes usar [UptimeRobot](https://uptimerobot.com) (gratuito): crea un monitor HTTP que haga ping al `/health` cada 14 minutos.

---

## 🔄 Deploy automático (CI/CD)

Una vez configurado, cada `git push` a `main` dispara un re-deploy automático en Render:

```bash
# Flujo de trabajo del equipo
git add .
git commit -m "feat: nueva funcionalidad"
git push origin main
# ↑ Render detecta el push y redespliega en ~2-3 minutos automáticamente
```

---

## 🐛 Solución de problemas frecuentes

### "Cannot connect to database"
→ Verifica que `DATABASE_URL` en las variables de entorno del backend sea la URL interna de Render (no la externa).

### "CORS error" en el frontend
→ Verifica que `CLIENT_URL` en el backend coincida exactamente con la URL del frontend (sin `/` al final).

### "Build failed" en el frontend
→ Asegúrate de que `REACT_APP_API_URL` esté configurada antes del build — Render la necesita en tiempo de compilación.

### El bracket no avanza al ganador
→ Las partidas de rondas posteriores necesitan `player1_id`/`player2_id` asignados. El backend lo hace automáticamente al guardar un resultado con `PATCH /api/matches/:id/score`.

---

*ArenaCore — Sprint 2 completado: Deploy en producción* 🎮
