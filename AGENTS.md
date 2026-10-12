# Contexto de IA para el Proyecto (AGENTS.md)

Este documento es la **fuente de verdad técnica y contextual para cualquier agente de Inteligencia Artificial** que trabaje en el repositorio **RunLearn**. Proporciona directrices arquitectónicas, reglas de diseño, especificación de APIs, estructura de archivos y buenas prácticas indispensables para garantizar intervenciones seguras, consistentes y de alta calidad.

---

## 1. Visión general del proyecto

**RunLearn** es un portal educativo interactivo (aula virtual) diseñado para la enseñanza de **programación web dinámica, arquitectura backend, seguridad web y DevOps**.

### Filosofía pedagógica
El concepto central de la plataforma es **hacer visible lo invisible**:
- Los estudiantes no se limitan a leer teoría; interactúan con **simulaciones y procesos reales paso a paso**.
- Se visualizan peticiones HTTP, headers, consultas SQL parametrizadas vs vulnerables, estados de caché Redis (HIT/MISS), aislamiento de contenedores Docker, transacciones ACID (BEGIN / COMMIT / ROLLBACK), tokens JWT, hashing con bcrypt y mitigaciones OWASP.
- **Cero magia**: Cada flujo explica qué ocurre internamente tanto en el cliente como en el servidor y en la base de datos.

### Estructura general de navegación
1. **Navbar global (`src/components/Navbar.astro`):**
   - Branding y navegación principal (`/`, `/clases`, `/login`, `/register`).
   - Integración con **Supabase Auth** en tiempo real (avatar con indicador de estado en línea/offline, nombre de usuario y botón de cerrar sesión).
   - **Buscador global:** Modal flotante activado por clic o atajo de teclado (`Cmd+K` / `Ctrl+K`) con búsqueda en vivo sobre los 19 módulos.
   - **Control de sonido:** Web Audio API centralizada con botón de activación/silencio sincronizado en localStorage.
2. **Home (`/`):**
   - Bento Grid con módulos técnicos destacados.
   - Accesos directos y contador general de clases.
3. **Catálogo de Clases (`/clases`):**
   - Explorador completo con filtrado dinámico por las 9 categorías temáticas y badges interactivos.
4. **Autenticación (`/login`, `/register`):**
   - Formularios accesibles conectados directamente a Supabase Auth.
5. **Vistas Explicativas Interactivas (`*-explicacion.astro`):**
   - Vistas dedicadas de alta interactividad que combinan diagramas SVG interactivos, terminales simuladas, consolas de paso a paso, visualizadores de código fuente y manejo de fallos de conexión al backend.

---

## 2. Arquitectura y Tecnologías

### Frontend
- **Framework:** [Astro 5](https://astro.build/) en modo estático (`output: 'static'`), empaquetado para distribución en `dist/` y desplegado en **Vercel**.
- **Islands Architecture (React 19):** Se utiliza React (`@astrojs/react`) **únicamente** en componentes que requieren gestión de estado compleja o ciclos de vida reactivos:
  - `src/components/modules/PeopleApiModule.jsx`: Simulador CRUD de API de personas con estados de carga y consola de queries.
  - `src/components/modules/GithubModule.jsx`: Simulador de flujo Git (working directory, staging, commit, push).
  - `src/components/modules/BackendErrorNotice.jsx`: Aviso flotante de error de conexión en islas React.
  - **Regla:** El resto de la interfaz debe mantenerse en Astro nativo (`.astro`) con scripts Vanilla ESM (`<script>`).
- **Estilos:**
  - Base: Reset y utilidades mínimas de Bootstrap 5 CSS (`bootstrap/dist/css/bootstrap.min.css`) importadas en `Layout.astro`.
  - Tokens globales: Variables CSS en `:root` definidas en `src/styles/global.css`.
  - Estilos encapsulados: Todo componente o página utiliza bloques `<style>` de Astro.
  - **Prohibido:** Tailwind CSS u otros utilitarios utility-first. No introducir librerías de estilos adicionales.
- **Audio Feedback:**
  - Sintetizador de audio nativo mediante Web Audio API (`src/lib/sounds.js` y `src/lib/soundControls.js`).
  - No requiere archivos `.mp3`/`.wav` externos.
- **Autenticación Frontend:**
  - Cliente singleton `@supabase/supabase-js` en `src/lib/supabaseClient.js`.
  - Configurado con `PUBLIC_SUPABASE_URL` y `PUBLIC_SUPABASE_ANON_KEY`.

### Backend API
- **Runtime & Framework:** Node.js 22 (ES Modules) + Express 4 en el subdirectorio `backend/`.
- **Despliegue:** Preparado para contenedor Docker o despliegue gestionado en **Render** (o Fly.io/Railway).
- **Base de Datos (PostgreSQL):**
  - Cliente `pg` con pool de conexiones (`backend/src/db/index.js`).
  - Conexión principal vía `DATABASE_URL` con soporte TLS/SSL para **Supabase PostgreSQL** en producción.
  - Fallback local configurable vía `PG_HOST`, `PG_PORT`, `PG_USER`, `PG_PASSWORD`, `PG_DATABASE` (útil con Docker Compose).
- **Caché (Redis):**
  - Cliente `ioredis` (`backend/src/cache/index.js`).
  - Conexión principal vía `REDIS_URL` con soporte TLS (`rediss://`, ej. **Upstash Redis**) en producción.
  - Fallback local configurable vía `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`.
- **Autenticación Backend Híbrida (`backend/src/middlewares/requireAuth.js`):**
  - `requireSupabaseAuth`: Valida tokens de acceso emitidos por Supabase Auth mediante verificación JWKS remota (`jose`) o firma legacy HS256 (`SUPABASE_JWT_SECRET`).
  - `requireAuth`: Valida tokens firmados localmente por RunLearn con `JWT_SECRET`.
- **Monitoreo & Métricas (`backend/src/metrics.js`):**
  - Middleware `trackRequest` que registra peticiones por minuto, tiempos de respuesta y códigos HTTP en memoria, expuestos en `GET /api/metrics`.
- **CORS:**
  - Dinámico mediante la variable de entorno `CORS_ORIGINS` (por defecto `*` en desarrollo; personalizable con lista separada por comas para producción, ej. `https://run-learn.vercel.app`).

### Versión estricta de Node.js
- **Node.js 22.x** fijado en:
  - `.nvmrc` (`22`)
  - `package.json` raíz (`"engines": { "node": "22.x" }`)
  - `backend/package.json` (`"engines": { "node": "22.x" }`)
- **Alerta crítica:** Node.js v26+ o versiones no soportadas rompen la compilación de Vite y Astro en este proyecto. Nunca alterar esta restricción.

---

## 3. Estructura de archivos y directorios

```text
RunLearn/
├── src/
│   ├── components/
│   │   ├── Navbar.astro               # Barra de navegación, estado Supabase, modal búsqueda, audio
│   │   ├── SectionDivider.astro       # Separador decorativo de secciones
│   │   ├── TechCard.astro             # Tarjeta interactiva del Bento Grid
│   │   ├── TechGrid.astro             # Grilla de módulos destacados en Home
│   │   ├── ClassIcon.astro            # Generador dinámico de iconos SVG por módulo
│   │   ├── BackendErrorBanner.astro   # Banner visible cuando el backend está caído/timeout
│   │   └── modules/                   # Islas interactivas React (client:load)
│   │       ├── PeopleApiModule.jsx    # UI reactiva del CRUD de la API People
│   │       ├── GithubModule.jsx       # Simulador interactivo de comandos Git
│   │       └── BackendErrorNotice.jsx # Cartel reactivo de fallback para islas
│   ├── data/
│   │   └── clases.js                  # Catálogo unificado de módulos, categorías y metadata
│   ├── layouts/
│   │   └── Layout.astro               # Layout HTML5 base con fonts, luces ambientales y CSS global
│   ├── lib/
│   │   ├── apiClient.js               # Cliente HTTP centralizado (fetchWithTimeout, banners, offline)
│   │   ├── sounds.js                  # Sintetizador Web Audio API (frecuencias y timbres)
│   │   ├── soundControls.js           # Orquestador del control de audio y toggle de mute
│   │   └── supabaseClient.js          # Cliente Supabase singleton para autenticación
│   ├── pages/
│   │   ├── index.astro                # Home / Dashboard principal
│   │   ├── clases.astro               # Catálogo completo con filtros por categoría
│   │   ├── login.astro                # Inicio de sesión con Supabase Auth
│   │   ├── register.astro             # Registro de usuarios con Supabase Auth
│   │   │                              # Vistas explicativas interactivas:
│   │   ├── api-explicacion.astro
│   │   ├── docker-explicacion.astro
│   │   ├── algoritmo-numero.astro
│   │   ├── servidor-explicacion.astro
│   │   ├── github-explicacion.astro
│   │   ├── bots-explicacion.astro
│   │   ├── ssr-vs-csr-explicacion.astro
│   │   ├── colas-explicacion.astro
│   │   ├── http-explicacion.astro
│   │   ├── database-explicacion.astro
│   │   ├── cache-redis-explicacion.astro
│   │   ├── transacciones-explicacion.astro
│   │   ├── recursividad-explicacion.astro
│   │   ├── sql-injection-explicacion.astro
│   │   ├── xss-explicacion.astro
│   │   ├── password-hashing-explicacion.astro
│   │   ├── jwt-inseguro-explicacion.astro
│   │   ├── csrf-explicacion.astro
│   │   ├── cors-explicacion.astro
│   │   └── path-traversal-explicacion.astro
│   └── styles/
│       └── global.css                 # Paleta de colores, tokens del sistema y variables :root
├── backend/
│   ├── src/
│   │   ├── index.js                   # Entry point del servidor HTTP Express
│   │   ├── app.js                     # Configuración de Express, CORS, middlewares y montaje de rutas
│   │   ├── metrics.js                 # Métricas de latencia y peticiones en memoria
│   │   ├── cache/
│   │   │   └── index.js               # Conexión Redis (soporte REDIS_URL con TLS)
│   │   ├── db/
│   │   │   ├── index.js               # Pool pg (soporte DATABASE_URL con SSL)
│   │   │   └── migrate.js             # Runner automático de migraciones SQL
│   │   ├── middlewares/
│   │   │   └── requireAuth.js         # Verificación JWT (Supabase JWKS/HS256 y RunLearn local)
│   │   ├── models/                    # Modelos de datos backend
│   │   └── routes/                    # Endpoints modulares de API y demos educativas
│   │       ├── auth.routes.js         # /api/auth (register, login, me)
│   │       ├── health.routes.js       # /api/health (estado DB, Redis, uptime)
│   │       ├── metrics.routes.js      # /api/metrics (latencias y requests)
│   │       ├── people.js              # /api/people (CRUD educativo de personas)
│   │       ├── progreso.js            # /api/progreso (GET/PUT de progreso autenticado)
│   │       ├── cache-demo.js          # /api/cache-demo (HIT/MISS Redis)
│   │       ├── transaccion-demo.js    # /api/transaccion-demo (transferencias SQL ACID)
│   │       ├── sqli-demo.js           # /api/sqli-demo (vulnerable vs parametrizado)
│   │       ├── hash-demo.js           # /api/hash-demo (bcrypt vs plain/md5)
│   │       ├── jwt-demo.js            # /api/jwt-demo (algoritmo 'none', firmas)
│   │       ├── csrf-demo.js           # /api/csrf-demo (tokens anti-CSRF)
│   │       ├── cors-demo.js           # /api/cors-demo (orígenes y headers)
│   │       └── path-traversal-demo.js # /api/path-traversal-demo (escape '../' vs seguro)
│   ├── db/migrations/
│   │   ├── 001_create_users.sql       # Tabla users para auth interna
│   │   ├── 002_create_people.sql      # Tabla people con datos semilla
│   │   ├── 003_create_cuentas_demo.sql# Cuentas bancarias de prueba para transacciones
│   │   └── 004_progreso.sql           # Progreso del alumno vinculado a auth.users(id) con RLS
│   ├── archivos-demo/                 # Archivos sandbox para la demo de Path Traversal
│   ├── Dockerfile                     # Imagen de producción del backend
│   ├── docker-compose.yml             # Orquestación local de Node, PostgreSQL y Redis
│   ├── package.json                   # Dependencias y scripts del backend
│   └── .env.example                   # Plantilla de variables de entorno del backend
├── astro.config.mjs                   # Configuración Astro 5, plugins y redirecciones de alias
├── .env.example                       # Variables de entorno requeridas para el frontend
├── README.md                          # Documentación pública general
└── package.json                       # Scripts y dependencias raíz del frontend
```

---

## 4. Redirecciones y Alias de Rutas en Astro

En `astro.config.mjs` están configuradas las siguientes **redirecciones estáticas oficiales**. No crear carpetas redundantes dentro de `src/pages/` para estos alias:

| Ruta Alias | Redirige a | Módulo |
| :--- | :--- | :--- |
| `/docker` | `/docker-explicacion` | Docker |
| `/base-de-datos` | `/database-explicacion` | Base de datos |
| `/http-https` | `/http-explicacion` | HTTP / HTTPS |
| `/servidor` | `/servidor-explicacion` | Servidor |
| `/github` | `/github-explicacion` | GitHub |
| `/bots` | `/bots-explicacion` | Bots |

---

## 5. Catálogo de Clases y Módulos (`src/data/clases.js`)

`src/data/clases.js` es la **fuente de verdad única** de los módulos pedagógicos disponibles. Cada módulo define:
```javascript
{
  id: "identificador-unico",
  title: "Título de la clase",
  category: "Categoría",
  icon: "nombre-icono-para-ClassIcon",
  description: "Subtítulo / breve descripción",
  route: "/ruta-explicacion",
  colorAccent: "#hexColor",
  dateAdded: "YYYY-MM-DD",
  status: "completo",
  featured: true, // opcional, para destacar en el Bento Grid de Home
}
```

### Categorías registradas (`categoriasClases`):
1. **Backend:** API, SSR vs CSR, Colas de mensajes, Transacciones SQL.
2. **DevOps:** Docker.
3. **Lógica:** Algoritmo de número, Recursividad.
4. **Sistema:** Servidor.
5. **Control:** GitHub.
6. **Automatización:** Bots.
7. **Redes:** HTTP / HTTPS.
8. **Almacén:** Base de datos, Caché con Redis.
9. **Seguridad:** SQL Injection, XSS, Hashing de Contraseñas, CSRF, CORS, Path Traversal.

### Tabla de módulos implementados:
| ID | Título | Categoría | Ruta | Interacción con Backend |
| :--- | :--- | :--- | :--- | :--- |
| `api` | API | Backend | `/api-explicacion` | Sí (`/api/people`) |
| `docker` | Docker | DevOps | `/docker-explicacion` | Simulador interactivo |
| `algoritmo` | Algoritmo de número | Lógica | `/algoritmo-numero` | Simulador client-side |
| `servidor` | Servidor | Sistema | `/servidor-explicacion` | Sí (`/api/metrics`, `/api/health`) |
| `github` | GitHub | Control | `/github-explicacion` | Simulador client-side (isla React) |
| `bots` | Bots | Automatización | `/bots-explicacion` | Simulador interactivo |
| `ssr-vs-csr` | SSR vs CSR | Backend | `/ssr-vs-csr-explicacion` | Simulador interactivo |
| `colas` | Colas de mensajes | Backend | `/colas-explicacion` | Simulador interactivo |
| `http` | HTTP / HTTPS | Redes | `/http-explicacion` | Simulador interactivo |
| `database` | Base de datos | Almacén | `/database-explicacion` | Simulador interactivo |
| `cache-redis` | Caché con Redis | Almacén | `/cache-redis-explicacion` | Sí (`/api/cache-demo`) |
| `transacciones` | Transacciones SQL | Backend | `/transacciones-explicacion` | Sí (`/api/transaccion-demo`) |
| `recursividad` | Recursividad | Lógica | `/recursividad-explicacion` | Simulador interactivo |
| `sql-injection` | SQL Injection | Seguridad | `/sql-injection-explicacion` | Sí (`/api/sqli-demo`) |
| `xss` | XSS | Seguridad | `/xss-explicacion` | Sandbox interactivo con sanitización |
| `password-hashing`| Hashing de Contraseñas | Seguridad | `/password-hashing-explicacion` | Sí (`/api/hash-demo`) |
| `csrf` | CSRF | Seguridad | `/csrf-explicacion` | Sí (`/api/csrf-demo`) |
| `cors` | CORS | Seguridad | `/cors-explicacion` | Sí (`/api/cors-demo`) |
| `path-traversal` | Path Traversal | Seguridad | `/path-traversal-explicacion` | Sí (`/api/path-traversal-demo`) |
| *(adicional)* | JWT Inseguro | Seguridad | `/jwt-inseguro-explicacion` | Sí (`/api/jwt-demo`) |

### Cómo agregar un nuevo módulo:
1. Registrar el objeto con su metadata correspondiente en `src/data/clases.js`.
2. Crear la página `src/pages/<nombre>-explicacion.astro`.
3. Si utiliza un icono específico no soportado, agregar el caso SVG en `src/components/ClassIcon.astro`.
4. Si consume endpoints del backend, crear o actualizar la ruta en `backend/src/routes/` y consumirla siempre mediante `apiClient.js`.
5. Ejecutar `npm run build` para validar que Astro compile la nueva ruta sin errores.

---

## 6. Endpoints de la Backend API

| Método | Endpoint | Middleware / Auth | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Público | Información general de la API y mapa de endpoints |
| `GET` | `/api/health` | Público | Healthcheck con estado de PostgreSQL, Redis y uptime |
| `GET` | `/api/metrics` | Público | Métricas de rendimiento, latencias y códigos HTTP |
| `POST` | `/api/auth/register`| Público | Registro con bcrypt y almacenamiento en PG |
| `POST` | `/api/auth/login` | Público | Login con JWT RunLearn |
| `GET` | `/api/auth/me` | `requireAuth` | Perfil del usuario autenticado |
| `GET` | `/api/people` | Público | Listar personas registradas |
| `GET` | `/api/people/:id` | Público | Obtener persona por ID |
| `POST` | `/api/people` | Público | Crear persona |
| `PUT` | `/api/people/:id` | Público | Actualizar persona |
| `DELETE`| `/api/people/:id`| Público | Eliminar persona |
| `GET` | `/api/progreso` | `requireSupabaseAuth` | Obtener clases completadas por el alumno |
| `PUT` | `/api/progreso` | `requireSupabaseAuth` | Actualizar estado de clase (`{ clase_id, completado }`) |
| `GET` | `/api/cache-demo` | Público | Demostración de consulta con caché Redis (HIT vs MISS) |
| `POST` | `/api/cache-demo/invalidate` | Público | Invalidación forzada de clave Redis |
| `POST` | `/api/transaccion-demo/transferir` | Público | Simulación ACID con `BEGIN`, `UPDATE`, `COMMIT` o `ROLLBACK` |
| `GET` | `/api/transaccion-demo/cuentas` | Público | Estado de saldos de prueba de Alice y Bob |
| `POST` | `/api/sqli-demo/vulnerable` | Público | Ejecución de consulta concatenada susceptible a SQLi |
| `POST` | `/api/sqli-demo/seguro` | Público | Ejecución de consulta parametrizada `$1, $2` segura |
| `POST` | `/api/hash-demo` | Público | Comparación de tiempo de hashing y hashes generados |
| `POST` | `/api/jwt-demo/sign` | Público | Emisión de token JWT (soporta algoritmo inseguro `none`) |
| `POST` | `/api/jwt-demo/verify` | Público | Validación pedagógica de token manipulado |
| `POST` | `/api/csrf-demo/transferir` | Público | Petición vulnerable a CSRF sin token antifalsificación |
| `POST` | `/api/csrf-demo/transferir-segura` | Público | Petición protegida con token CSRF válido |
| `GET` | `/api/cors-demo/data` | Configurable | Demostración de cabeceras CORS (`Access-Control-Allow-Origin`) |
| `GET` | `/api/path-traversal-demo/read` | Público | Lectura de archivos (demuestra prevención de `../../`) |

---

## 7. Esquema de Base de Datos y Migraciones

El backend administra migraciones SQL idempotentes en `backend/db/migrations/`:
- **`001_create_users.sql`:** Tabla `users` (id, email, password_hash, rol, created_at).
- **`002_create_people.sql`:** Tabla `people` (id, nombre, email, rol, created_at) con datos iniciales.
- **`003_create_cuentas_demo.sql`:** Tabla `cuentas_demo` (id, titular, saldo) con saldos iniciales de prueba.
- **`004_progreso.sql`:** Tabla `public.progreso` (user_id UUID referencias `auth.users(id)`, clase_id text, completado boolean, updated_at).
  - Incluye **Row Level Security (RLS)** y política que asegura que cada estudiante solo pueda leer y escribir su propio progreso (`(SELECT auth.uid()) = user_id`).

### Ejecución de migraciones:
```bash
# Dentro de backend/
npm run migrate
```

---

## 8. Comunicación Frontend-Backend y Resiliencia

### Reglas críticas de consumo de API:
1. **Centralización absoluta:** Usar **únicamente** los helpers de `src/lib/apiClient.js`:
   - `getApiBaseUrl()`: Determina la URL base (en navegador: `window.RUNLEARN_API_URL`, luego `PUBLIC_API_URL`, fallback local `http://localhost:5000` solo en desarrollo).
   - `fetchWithTimeout(url, options, timeoutMs)`: Envuelve `fetch` con timeout (default 6000ms), cancelaciones limpias mediante `AbortController` y tipificación de errores de red.
   - `showBackendErrorBanner(bannerId, customMessage)` / `hideBackendErrorBanner(bannerId)`: Muestra u oculta el banner visual sin romper el flujo de la página.
2. **NUNCA hardcodear URLs:** Está estrictamente prohibido escribir `http://localhost:5000` directamente en archivos `.astro`, `.jsx` o scripts de cliente.
3. **Manejo de estados offline:** Si el backend no responde, la UI debe permanecer navegable y mostrar de forma clara el aviso al estudiante mediante `BackendErrorBanner.astro` o `BackendErrorNotice.jsx`.

---

## 9. Sistema de Diseño, Tokens y Reglas de Maquetación

### Tokens globales (`src/styles/global.css`)
Usar siempre variables de `:root`:
- **Fondos:** `--canvas-bg` (`#07080b`), `--surface-panel` (`#0d1015`), `--surface-card` (`#12161d`), `--surface-card-hover` (`#181e28`).
- **Bordes:** `--border-hairline`, `--border-subtle`, `--border-hover`, `--glass-highlight`.
- **Textos:** `--text-white` (`#ffffff`), `--text-primary` (`#f1f5f9`), `--text-secondary` (`#94a3b8`), `--text-muted` (`#64748b`).
- **Acentos tecnológicos:** `--brand-blue` (`#3b82f6`), `--color-docker` (`#0ea5e9`), `--color-html` (`#f97316`), `--color-ubuntu` (`#ea580c`), `--color-github` (`#e2e8f0`), `--color-gitlab` (`#f43f5e`), `--color-http` (`#06b6d4`), `--color-db` (`#a855f7`), `--color-redis` (`#dc2626`), `--color-success` (`#10b981`).
- **Tipografías:** `--font-main` (`'Plus Jakarta Sans'`), `--font-mono` (`'JetBrains Mono'`).
- **Radios:** `--radius-dashboard` (`28px`), `--radius-card` (`18px`), `--radius-pill` (`9999px`).
- **Transiciones:** `--ease-spring`, `--ease-fast`.

### Reglas de maquetación y responsive:
- **Contenedor `.dashboard`:** Ocupa `width: 100%`, `min-height: 100vh`. No encerrar en wrappers rígidos que limiten el ancho ni agregar propiedades de overflow que generen barras de desplazamiento dobles.
- **Soporte responsive:** Soportar desde pantallas móviles pequeñas (320px) hasta monitores ultrawide sin desbordamiento horizontal.
- **Grillas Bento (`TechGrid.astro`):**
  - Desktop (>960px): 4 columnas (`repeat(4, 1fr)`).
  - Tablet (≤960px): 2 columnas (`repeat(2, 1fr)`).
  - Mobile (≤640px): 2 columnas compactas (o 1 columna en resoluciones extremas).
- **Tarjetas (`TechCard.astro`):**
  - Utilizan `--theme-color` y `--theme-glow` para efectos de iluminación y borde al hacer hover o focus.

### Patrón estructural obligatorio de vistas `*-explicacion.astro`:
Cada vista explicativa debe seguir esta arquitectura de 4 componentes:
1. **Diagrama o Canvas Interactivo:** Representación gráfica paso a paso del flujo.
2. **Consola o Visualizador de Código:** Panel con resaltado de sintaxis, queries SQL o comandos terminales correspondientes al paso actual.
3. **Controles de Secuencia & Explicación:** Botones de paso anterior/siguiente, reset y explicación textual breve y didáctica.
4. **Sonidos & Resiliencia:** Efectos de audio a través de `src/lib/soundControls.js` y banner de estado `BackendErrorBanner.astro` cuando hay interacción con el servidor.

---

## 10. Variables de Entorno

### Frontend (`.env` y `.env.example` en la raíz)
```env
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-or-publishable-key
SUPABASE_URL=https://your-project.supabase.co
PUBLIC_API_URL=http://localhost:5000
```
> En Vercel (producción), `PUBLIC_API_URL` debe apuntar al servicio backend desplegado (ej. `https://runlearn-backend.onrender.com`).

### Backend (`backend/.env` y `backend/.env.example`)
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=tu-clave-secreta-para-jwt-local
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_JWT_SECRET=tu-clave-legacy-si-aplica
CORS_ORIGINS=*

# Conexión PostgreSQL (Supabase en producción, o local)
DATABASE_URL=postgresql://postgres.xxxx:password@aws-0.region.pooler.supabase.com:6543/postgres
PG_HOST=localhost
PG_PORT=5432
PG_USER=postgres
PG_PASSWORD=postgres
PG_DATABASE=runlearn_db

# Conexión Redis (Upstash en producción, o local)
REDIS_URL=rediss://default:password@host.upstash.io:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

---

## 11. Flujo de Trabajo y Comandos para Agentes

### Comandos de desarrollo y validación:
```bash
# Frontend (raíz):
npm run dev        # Iniciar servidor de desarrollo de Astro
npm run build      # Validar compilación estática (OBLIGATORIO tras cambios)
npm run preview    # Previsualizar el build estático generado

# Backend (directorio backend/):
npm run dev        # Iniciar backend con node --watch
npm run start      # Iniciar backend en modo producción
npm run migrate    # Ejecutar migraciones SQL
```

### Reglas estrictas de ejecución para agentes:
1. **Validación obligatoria:**
   - Cada modificación en `src/` exige ejecutar `npm run build` en la raíz del proyecto para asegurar que no existan errores de compilación estática ni dependencias rotas.
   - Cada modificación en `backend/` exige comprobar la sintaxis y ejecución de los módulos Node.
2. **Scripts en Astro y ciclo de vida:**
   - Evitar registrar event listeners duplicados. Emplear banderas en el DOM (`dataset`) o verificar `document.readyState` para asegurar una inicialización limpia.
3. **Mantenimiento de documentación y entorno:**
   - Si se agrega una nueva variable de entorno, actualizar inmediatamente tanto el archivo `.env.example` correspondiente como este `AGENTS.md`.
4. **Políticas de Git:**
   - **No ejecutar** `git add`, `git commit` ni `git push` a menos que el usuario lo solicite expresamente. Al finalizar la tarea, resumir claramente los archivos creados o modificados.
