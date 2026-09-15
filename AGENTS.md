# Contexto de IA para el Proyecto (AGENTS.md)

Este documento proporciona contexto operativo, arquitectónico y de convenciones para cualquier asistente de IA o agente de código que trabaje en este repositorio.

---

## 1. Visión general del proyecto

**RunLearn** (o **DevPlatform**) es una plataforma tipo aula virtual y dashboard de aprendizaje para desarrolladores.
El objetivo de la interfaz es presentar de manera limpia y visual:
- Un header de navegación superior (perfil, accesos rápidos, buscador y acciones).
- Una grilla tipo bento grid con módulos o tecnologías clave (API, Docker, HTML/CSS, Ubuntu, GitHub, GitLab, HTTP/3, Database).
- Un separador con métricas/contador de estado activo.
- Una bandeja inferior de cursos y apuntes con barras de progreso y estado de avance.

---

## 2. Arquitectura y tecnologías

- **Framework:** Astro 5 (`astro`). No utiliza frameworks cliente pesados (ni React, Vue o Svelte); toda la interactividad estructural se maneja con componentes nativos de Astro (`.astro`) y CSS estándar.
- **Renderizado:** Estático (`output: "static"`).
- **Estilos:**
  - Tokens globales y layout base en `src/styles/global.css`.
  - Estilos de componente encapsulados dentro de etiquetas `<style>` en cada archivo `.astro`.
  - No se utiliza Tailwind ni frameworks CSS utilitarios. Se emplean variables CSS (`var(--...)`), CSS Grid, Flexbox y transiciones nativas.
- **Tipografía y assets:** Fuentes cargadas vía Google Fonts en `Layout.astro`. Los iconos son vectores SVG nativos integrados directamente en el código de cada tarjeta o pasados mediante `<slot name="icon" />`.

---

## 3. Estructura de archivos clave

```text
├── src/
│   ├── components/
│   │   ├── CourseCard.astro       # Tarjeta de curso (progreso, estatus, temática)
│   │   ├── CoursesTray.astro      # Bandeja contenedora de cursos
│   │   ├── Navbar.astro           # Barra de navegación superior
│   │   ├── SectionDivider.astro   # Separador de secciones con punto brillante y badge
│   │   ├── TechCard.astro         # Tarjeta de módulo tecnológico (soporta hover glow dinámico)
│   │   └── TechGrid.astro         # Grilla 4x2 de tecnologías
│   ├── layouts/
│   │   └── Layout.astro           # Plantilla base (head, ambient glows, app-viewport, dashboard)
│   ├── pages/
│   │   └── index.astro            # Punto de entrada de la página
│   └── styles/
│       └── global.css             # Tokens (:root), reset, body y ambient glow
├── astro.config.mjs
└── package.json
```

---

## 4. Reglas de diseño y maquetación

1. **Tamaño y pantalla (100% Viewport):**
   - El dashboard debe abarcar el 100% del ancho y alto disponible (`width: 100%`, `min-height: 100vh`).
   - No envolver el contenedor principal `.dashboard` en anchos fijos pequeños (como `max-width: 1120px`), salvo paddings internos para espaciado respecto a los bordes de la ventana.
2. **Tokens de color y estado:**
   - Usar siempre las variables definidas en `:root` (`--canvas-bg`, `--surface-card`, `--border-subtle`, `--text-primary`, `--ease-spring`, etc.).
   - Las tarjetas soportan `--theme-color` y `--theme-glow` para efectos de resplandor contextual al hacer hover.
3. **Responsividad:**
   - Mantener consistencia en los breakpoints estándar del proyecto:
     - Desktop (> 960px): Grillas en 4 columnas.
     - Tablet (<= 960px): Grillas en 2 columnas, buscador compacto.
     - Mobile (<= 640px): 1 columna para cursos, 2 columnas compactas para tech cards, navbar envuelto.

---

## 5. Directrices para agentes al realizar cambios

- **Fuente de la verdad:** La aplicación activa se desarrolla exclusivamente en `src/`.
- **Validación de cambios:** Tras realizar modificaciones de código en `src/`, ejecutar siempre:
  ```bash
  npm run build
  ```
  para confirmar que la compilación de Astro no genere errores de sintaxis ni de tipos.
- **Preservar la estética:** Mantener el lenguaje visual minimalista oscuro, el contraste accesible, el espaciado bento y los micro-efectos interactivos (`:hover`, `:focus-visible`).
