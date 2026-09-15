# RunLearn (DevPlatform)

Dashboard y aula virtual para desarrolladores. Interfaz oscura con estética tipo bento grid inspirada en herramientas como Linear o Raycast, pensada para organizar módulos de aprendizaje (APIs, Docker, bases de datos, etc.) y dar seguimiento al progreso de clases o apuntes activos.

Construido sobre **Astro 5** con componentes modulares y CSS nativo basado en tokens de diseño.

---

## Stack

- **Framework:** [Astro 5](https://astro.build/)
- **Estilos:** CSS moderno (variables CSS, flexbox, grid, glassmorphism, responsive)
- **Tipografía:** Plus Jakarta Sans & JetBrains Mono (vía Google Fonts)
- **Modo:** Renderizado estático (SSG)

---

## Inicio rápido

### Requisitos

- Node.js 18.x o superior
- npm (o pnpm / yarn)

### Instalación y ejecución local

```bash
# 1. Instalar dependencias
npm install

# 2. Levantar servidor de desarrollo (por defecto en localhost:4321)
npm run dev

# 3. Compilar para producción
npm run build

# 4. Probar la versión de producción localmente
npm run preview
```

---

## Estructura del proyecto

```text
RunLearn/
├── src/
│   ├── components/            # Componentes de interfaz Astro
│   │   ├── CourseCard.astro      # Tarjeta individual de curso/apunte con barra de progreso
│   │   ├── CoursesTray.astro     # Contenedor de cursos en progreso
│   │   ├── Navbar.astro          # Barra superior (perfil, tabs, buscador y menú)
│   │   ├── SectionDivider.astro  # Separador de secciones con contador y dot dinámico
│   │   ├── TechCard.astro        # Tarjeta tecnológica interactiva (hover, badge, glow)
│   │   └── TechGrid.astro        # Grilla bento de módulos tecnológicos
│   ├── layouts/
│   │   └── Layout.astro          # Shell principal HTML, fuentes y luces ambientales
│   ├── pages/
│   │   └── index.astro           # Página principal del dashboard
│   └── styles/
│       └── global.css            # Tokens de diseño, reset, fondos y estilos globales
├── astro.config.mjs           # Configuración de Astro
├── package.json
└── .gitignore
```

---

## Sistema de diseño y estilos

- **Tokens globales:** Definidos en `:root` dentro de `src/styles/global.css` (paleta de colores por tecnología, elevaciones, bordes, radios y transiciones elásticas).
- **Fondos y ambientación:** Fondo `#07080b` con patrón de puntos finos (`dot-matrix`) y luces difusas ambientales (`.ambient-glow`).
- **Diseño fluido al 100%:** El dashboard se expande aprovechando todo el ancho de pantalla (`viewport`), reorganizando los módulos en columnas adaptativas según la resolución (desktop, tablet y móvil).
