# RunLearn

Aula virtual interactiva para aprender programación web dinámica. Incluye un dashboard de módulos educativos, páginas explicativas con simulaciones y una API Express independiente para las demostraciones que necesitan backend.

## Stack

- Astro 5 con salida estática para Vercel.
- React solo en los módulos interactivos.
- Supabase Auth para registro, inicio y cierre de sesión.
- Express, PostgreSQL y Redis en `backend/` para las demos que requieren servicios reales.
- Node.js 22, fijado en `.nvmrc` y en `package.json`.

## Ejecutar localmente

```bash
nvm use
npm install
cp .env.example .env
npm run dev
```

Sin las variables de Supabase, las páginas educativas siguen disponibles, pero el registro e inicio de sesión muestran un mensaje de configuración. Para activarlos, completar en `.env`:

```env
PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
PUBLIC_SUPABASE_ANON_KEY=<anon-o-publishable-key>
```

Ambos valores se publican en el bundle del navegador. No poner aquí `service_role`, claves secretas ni contraseñas. La autenticación utiliza Supabase Auth y no requiere crear tablas adicionales. Si se agregan tablas de cursos, progreso o perfiles, activar RLS y definir sus políticas antes de exponerlas desde el navegador.

En Supabase, habilitar Email/Password en **Authentication → Providers → Email**. Configurar **Authentication → URL Configuration** con la URL del sitio y permitir las URLs locales y de producción para los enlaces de confirmación de correo. Si se exige confirmación de email, el alta mostrará que hay que revisar el correo; el usuario podrá iniciar sesión después de confirmar.

## Desplegar el frontend en Vercel

Importar el repositorio en Vercel y usar:

- Framework preset: Astro (o Other).
- Install command: `npm install`.
- Build command: `npm run build`.
- Output directory: `dist`.
- Node.js: 22.x.

Agregar `PUBLIC_SUPABASE_URL` y `PUBLIC_SUPABASE_ANON_KEY` en las variables de entorno de Vercel para Production, Preview y Development según corresponda. Volver a desplegar después de cambiarlas. Agregar el dominio final a las URLs permitidas de Supabase.

## Demos con backend

Vercel publica el frontend estático; no ejecuta el Docker Compose con Express, PostgreSQL y Redis. Las simulaciones que llaman endpoints como `/api/people`, `/api/metrics` o `/api/csrf-demo` requieren publicar `backend/` junto con sus servicios en un host de backend. Configurar luego `PUBLIC_API_URL` con la URL HTTPS de esa API en Vercel. El backend debe permitir CORS desde el dominio de RunLearn y contar con sus propias variables de entorno seguras.

Para ejecutar el backend localmente:

```bash
cd backend
cp .env.example .env
docker compose up -d --build
```

En local, `PUBLIC_API_URL` puede omitirse y el frontend usa `http://localhost:5000`.

## Contenido y alcance actual

Las clases y sus rutas viven en `src/data/clases.js`; el contenido es estático y está versionado con el frontend. El acceso Supabase cubre cuentas de usuario. La creación de clases por usuarios, el guardado de progreso y la administración dinámica de contenidos aún requieren esquema de base de datos, políticas RLS y sus pantallas asociadas.

## Comandos

```bash
npm run dev       # desarrollo en localhost:4321
npm run build     # compilación de producción a dist/
npm run preview   # previsualización local de dist/
```
