# Contexto de IA para el Proyecto (AGENTS.md)

## 1. Visión general del proyecto

**RunLearn** es un portal educativo tipo aula virtual para una materia de programación
web dinámica. Concepto central: los estudiantes EJECUTAN y ven procesos internos paso
a paso (APIs, Docker, algoritmos, seguridad), nunca "por arte de magia".

Estructura del Home: header de navegación, bento grid con 8 módulos técnicos (cada
uno con su propia vista de simulación), separador de sección, y bandeja de
cursos/apuntes con progreso.

## 2. Arquitectura y tecnologías

- **Framework:** Astro 5, output estático para las páginas de contenido.
- **Interactividad:** React como islands (`client:load`) SOLO en los módulos que
  necesitan estado/interactividad real (ej. PeopleApiModule.jsx, GithubModule.jsx).
  El resto de la UI (layout, cards, navegación) es Astro puro + `<script>` nativo.
- **Backend:** Node.js + Express + API REST, en `backend/`. NO es parte del build
  estático de Astro — corre aparte (Docker Compose).
- **DB / Cache:** PostgreSQL + Redis, vía Docker Compose (`backend/docker-compose.yml`).
- **Node version:** siempre v22 (vía fnm). Node 26+ rompe Vite/Astro en este proyecto.
- **Estilos:** tokens CSS globales en `src/styles/global.css`, estilos encapsulados
  en `<style>` de cada `.astro`. No se usa Tailwind ni frameworks CSS utilitarios.
  CSS Grid, Flexbox y variables (`var(--...)`).
- **Deploy planeado:** Vercel (solo frontend; el backend va aparte, Vercel no corre
  Docker/Postgres/Redis persistentes).

## 3. Estructura de archivos clave

```text
├── src/
│   ├── components/
│   │   ├── CourseCard.astro, CoursesTray.astro, Navbar.astro
│   │   ├── SectionDivider.astro, TechCard.astro, TechGrid.astro, ClassIcon.astro
│   │   └── modules/            # islands React: PeopleApiModule.jsx, GithubModule.jsx
│   ├── data/
│   │   └── clases.js           # fuente central de TODOS los módulos/clases
│   ├── lib/
│   │   └── soundControls.js    # efectos de sonido (Web Audio API) + mute en localStorage
│   ├── layouts/Layout.astro
│   ├── pages/
│   │   ├── index.astro, login.astro, clases.astro
│   │   └── *-explicacion.astro # una vista de simulación por módulo
│   └── styles/global.css
├── backend/
│   ├── src/routes/             # rutas REST, protegidas con requireAuth (JWT)
│   ├── db/migrations/          # migraciones SQL
│   └── docker-compose.yml      # node + postgres + redis
├── astro.config.mjs
└── package.json
```

## 4. Reglas de diseño y maquetación

1. Dashboard a 100% de viewport (`width: 100%`, `min-height: 100vh`), sin envolver
   `.dashboard` en anchos fijos chicos.
2. Usar siempre los tokens de `:root` (`--canvas-bg`, `--surface-card`,
   `--border-subtle`, `--text-primary`, `--ease-spring`, etc.). Las cards soportan
   `--theme-color`/`--theme-glow` para el glow de hover.
3. Breakpoints: Desktop >960px (grillas 4 columnas), Tablet ≤960px (2 columnas),
   Mobile ≤640px (1 columna cursos, 2 columnas tech cards, navbar envuelto).
4. Todas las vistas `*-explicacion.astro` siguen el mismo patrón: diagrama animado +
   panel de código con línea resaltada + explicación paso a paso + sonido por paso
   (vía `soundControls.js`, nunca duplicar lógica de audio).
5. Módulos "peligrosos" (Docker, terminal, ataques de bots) son SIMULACIÓN VISUAL,
   nunca ejecución real ni código de ataque funcional.
6. Cada módulo nuevo se agrega como entrada en `src/data/clases.js`, no hardcodeado
   en `TechGrid.astro`.

## 5. Directrices para agentes al realizar cambios

- Fuente de la verdad del frontend: `src/`. Del backend: `backend/src/`.
- Tras modificar `src/`, correr siempre `npm run build` para validar.
- Tras modificar `backend/`, correr `cd backend && docker compose up -d --build`.
- El botón de simulación se rompe si el listener queda atado a `astro:page-load`
  sin View Transitions — usar `DOMContentLoaded` + chequeo de `document.readyState`.
- Preservar la estética minimalista oscura, contraste accesible, espaciado bento y
  micro-efectos (`:hover`, `:focus-visible`).
- Al terminar: confirmar que el build pasa, listar qué archivos se tocaron, y NO
  hacer `git add`/`git commit` salvo que se pida explícitamente.
