# Contexto de IA para el Proyecto (AGENTS.md)

## 1. Visión general del proyecto

**RunLearn** es un portal educativo tipo aula virtual para una materia de programación
web dinámica. Concepto central: los estudiantes EJECUTAN y ven procesos internos paso
a paso (APIs, Docker, algoritmos, seguridad y OWASP, bases de datos, redes), nunca
"por arte de magia".

Estructura de la aplicación:
- **Navbar:** navegación global, branding, indicadores de ruta y controles de sesión (Supabase Auth).
- **Home (`/`):** Bento Grid con catálogo completo de 19 módulos técnicos organizados por categorías (Backend, DevOps, Lógica, Sistema, Control, Redes, Almacén, Seguridad).
- **Clases (`/clases`):** vista de exploración del catálogo de clases con filtros y badges por categoría.
- **Autenticación (`/login`, `/register`):** registro e inicio de sesión integrados con Supabase Auth.
- **Vistas explicativas (`*-explicacion.astro`):** páginas interactivas dedicadas con simulador, diagramas animados paso a paso, visualizador de código/queries y estado de conexión al backend.

> Nota: La sección decorativa "Tus apuntes / Cursos" con progreso ficticio fue eliminada (`CourseCard.astro` y `CoursesTray.astro` ya no existen).

## 2. Arquitectura y tecnologías

- **Frontend:** Astro 5 con salida estática (`dist/`), desplegado en Vercel.
- **Interactividad frontend:** React como islands (`client:load`) SOLO en componentes
  que requieren estado o lógica compleja (`PeopleApiModule.jsx`, `GithubModule.jsx`,
  `BackendErrorNotice.jsx`). El resto de la UI es Astro nativo con scripts Vanilla.
- **Autenticación:** Supabase Auth en el cliente vía `@supabase/supabase-js` (`src/lib/supabaseClient.js`),
  manejado con `PUBLIC_SUPABASE_URL` y `PUBLIC_SUPABASE_ANON_KEY`.
- **Comunicación con Backend:** Centralizada a través de `src/lib/apiClient.js`
  (`getApiBaseUrl()`, `fetchWithTimeout()`, `showBackendErrorBanner()`, `hideBackendErrorBanner()`).
  Lee `PUBLIC_API_URL` (en Vercel apunta al backend en producción; en local cae a `http://localhost:5000`).
  NUNCA hardcodear `http://localhost:5000` directamente en componentes ni scripts.
- **Backend API:** Node.js (ES Modules) + Express en `backend/`. Provee endpoints educativos
  para People API, métricas del servidor, SQLi demo, Hash demo, JWT demo, CSRF demo,
  CORS demo, Path Traversal demo, Transacciones SQL y Cache Redis.
  - **Despliegue de Backend:** Preparado para producción en **Render** (o Docker/Cloud).
  - **Base de Datos:** PostgreSQL con soporte para `DATABASE_URL` con SSL (ej. Supabase)
    y fallback local `PG_*` (Docker Compose).
  - **Cache:** Redis con soporte para `REDIS_URL` con TLS (`rediss://`, ej. Upstash)
    y fallback local `REDIS_*` (Docker Compose).
  - **CORS:** Configurable en producción vía variable `CORS_ORIGINS`.
- **Node version:** Fijada estrictamente en v22 (`.nvmrc`, `package.json` engines en raíz y `backend/package.json`).
  Node 26+ rompe Vite/Astro en este proyecto.
- **Estilos:** Tokens CSS globales en `src/styles/global.css`, estilos encapsulados en `<style>`
  de cada archivo `.astro`. No se usa Tailwind ni frameworks utilitarios. CSS Grid, Flexbox y variables (`var(--...)`).

## 3. Estructura de archivos clave

```text
├── src/
│   ├── components/
│   │   ├── Navbar.astro, SectionDivider.astro, TechCard.astro, TechGrid.astro
│   │   ├── ClassIcon.astro, BackendErrorBanner.astro
│   │   └── modules/            # Islands React: PeopleApiModule.jsx, GithubModule.jsx, BackendErrorNotice.jsx
│   ├── data/
│   │   └── clases.js           # Fuente central de TODOS los módulos/clases (19 módulos actuales)
│   ├── lib/
│   │   ├── soundControls.js    # Efectos de sonido (Web Audio API) + toggle mute
│   │   ├── sounds.js           # Sintetizador y frecuencias de audio nativo
│   │   ├── apiClient.js        # Helper centralizado para fetch, timeouts y error banners
│   │   └── supabaseClient.js   # Cliente Supabase singleton para auth
│   ├── layouts/
│   │   └── Layout.astro        # Layout base con head, meta tags, Navbar y contenedor
│   ├── pages/
│   │   ├── index.astro, clases.astro, login.astro, register.astro
│   │   ├── api-explicacion.astro, docker-explicacion.astro, database-explicacion.astro
│   │   ├── http-explicacion.astro, servidor-explicacion.astro, github-explicacion.astro
│   │   ├── bots-explicacion.astro, algoritmo-numero.astro, ssr-vs-csr-explicacion.astro
│   │   ├── colas-explicacion.astro, cache-redis-explicacion.astro, transacciones-explicacion.astro
│   │   ├── recursividad-explicacion.astro, sql-injection-explicacion.astro, xss-explicacion.astro
│   │   ├── password-hashing-explicacion.astro, jwt-inseguro-explicacion.astro, csrf-explicacion.astro
│   │   ├── cors-explicacion.astro, path-traversal-explicacion.astro
│   │   └── base-de-datos/ bots/ docker/ github/ http-https/ servidor/  # Alias de rutas
│   └── styles/
│       └── global.css          # Variables de diseño y tokens del sistema
├── backend/
│   ├── src/
│   │   ├── index.js, app.js, metrics.js
│   │   ├── db/                 # Conexión PG (soporta DATABASE_URL con SSL) y migrate.js
│   │   ├── cache/              # Cliente ioredis (soporta REDIS_URL con TLS)
│   │   ├── middlewares/        # requireAuth.js (JWT)
│   │   ├── models/             # Modelos de datos
│   │   └── routes/             # auth, health, metrics, people, cache-demo, transaccion-demo,
│   │                           # sqli-demo, hash-demo, jwt-demo, csrf-demo, cors-demo, path-traversal-demo
│   ├── db/migrations/          # Migraciones SQL idempotentes (001_users, 002_people, 003_cuentas_demo)
│   ├── archivos-demo/          # Archivos de texto para demo de path traversal
│   ├── Dockerfile, docker-compose.yml
│   └── .env.example
├── astro.config.mjs
├── .env.example
├── README.md
└── package.json
```

## 4. Reglas de diseño y maquetación

1. **Dashboard y Grillas:** `width: 100%`, `min-height: 100vh`, sin envolver `.dashboard`
   en contenedores rígidos. Soportar pantallas estrechas (hasta 320px) sin overflow horizontal.
2. **Tokens del Sistema:** Usar siempre variables de `:root` (`--canvas-bg`, `--surface-card`,
   `--border-subtle`, `--text-primary`, `--ease-spring`, etc.). Las cards utilizan
   `--theme-color`/`--theme-glow` para hover y badges de color.
3. **Breakpoints responsivos:**
   - Desktop >960px: Grillas de 4 columnas.
   - Tablet ≤960px: Grillas de 2 columnas.
   - Mobile ≤640px: 2 columnas en TechGrid (o 1 col en anchos muy reducidos), títulos envueltos.
4. **Patrón de Simulación:** Todas las vistas `*-explicacion.astro` combinan:
   - Diagrama animado / interactivo.
   - Panel de código o consulta con resaltado de paso.
   - Explicación paso a paso acompañada de audio mediante `soundControls.js` (nunca duplicar audio).
   - Manejo de fallback/offline con `BackendErrorBanner.astro` si el módulo conecta al backend.
5. **Seguridad en Demos:** Módulos de ataque (SQLi, XSS, CSRF, Path Traversal, Botnets, Docker)
   son estrictamente con fines formativos dentro de un entorno controlado/sandbox y con
   simulación visual clara de cómo mitigar la vulnerabilidad.
6. **Módulos Nuevos:** Cada nuevo módulo o clase se registra en `src/data/clases.js`,
   especificando su metadata (`id`, `title`, `category`, `icon`, `description`, `route`,
   `colorAccent`, `status`).

## 5. Directrices para agentes al realizar cambios

- **Fuentes de verdad:**
  - Frontend: `src/` (y `src/data/clases.js` para el catálogo).
  - Backend: `backend/src/` (y `backend/db/migrations/` para el esquema SQL).
- **Consumo de API:** Usar siempre `getApiBaseUrl()` o `fetchWithTimeout()` de `src/lib/apiClient.js`.
  NUNCA introducir URLs quemadas a `localhost:5000`. Incluir `BackendErrorBanner` o `BackendErrorNotice`.
- **Scripts y Ciclo de Vida:** Si se registran event listeners en páginas Astro, asegurar que no
  se dupliquen ni fallen con la navegación. Emplear `DOMContentLoaded` con comprobación de
  `document.readyState === 'loading'`.
- **Validaciones obligatorias:**
  - Tras modificar `src/`: correr `npm run build` en la raíz para validar compilación estática.
  - Tras modificar `backend/`: verificar sintaxis/ejecución con `npm run start` o Docker Compose.
- **Entorno y Variables:**
  - Frontend: `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`, `PUBLIC_API_URL` en `.env`.
  - Backend: `DATABASE_URL` o `PG_*`, `REDIS_URL` o `REDIS_*`, `JWT_SECRET`, `CORS_ORIGINS`, `PORT`.
  - Recordar mantener actualizados tanto `.env.example` en la raíz como `backend/.env.example` si se agregan nuevas variables.
- **Git:** Al terminar, verificar que el build pase, resumir los archivos intervenidos y
  NO ejecutar `git add`/`git commit` salvo solicitud explícita del usuario.

