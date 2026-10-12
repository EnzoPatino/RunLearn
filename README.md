# RunLearn

Aula virtual interactiva para aprender programación web dinámica. Incluye un catálogo bento de 19 módulos técnicos, páginas explicativas interactivas con simulaciones paso a paso y una API REST Express independiente para las demostraciones que requieren backend y persistencia.

## Stack

- **Frontend:** Astro 5 con salida estática desplegado en Vercel.
- **Interactividad UI:** React islands (`client:load`) en módulos con estado complejo (`PeopleApiModule`, `GithubModule`, `BackendErrorNotice`).
- **Autenticación:** Supabase Auth (`@supabase/supabase-js`) para registro, inicio y cierre de sesión.
- **Backend API:** Node.js 22 + Express en `backend/` con soporte para Render o Docker Compose.
- **Persistencia & Caché:** PostgreSQL (local con Docker o producción con Supabase) y Redis (local con Docker o producción con Upstash).
- **Node.js:** Versión 22 fijada en `.nvmrc` y en `engines` de `package.json`.

## Ejecutar localmente

### 1. Frontend

```bash
nvm use
npm install
cp .env.example .env
npm run dev
```

El sitio estará disponible en `http://localhost:4321`. Sin las variables de Supabase, las páginas educativas siguen totalmente operativas, pero el registro e inicio de sesión mostrarán un aviso de configuración pendiente.

Para habilitar la autenticación localmente, configurar en `.env`:

```env
PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
PUBLIC_SUPABASE_ANON_KEY=<anon-o-publishable-key>
PUBLIC_API_URL=http://localhost:5000
```

> **Nota de seguridad:** Ambos valores de Supabase son públicos para el navegador. No colocar aquí `service_role`, claves secretas ni contraseñas. En Supabase, habilitar Email/Password en **Authentication → Providers → Email** y agregar `http://localhost:4321` a las URLs permitidas en **Authentication → URL Configuration**.

### 2. Backend (opcional para demos en vivo)

El frontend detecta si el backend está desconectado y muestra un banner amigable. Para levantar la API y las bases de datos en local:

**Opción A — Docker Compose (Recomendada):**

```bash
cd backend
cp .env.example .env
docker compose up -d --build
```

Esto inicia Express en `http://localhost:5000`, PostgreSQL en el puerto 5432 y Redis en el 6379, corriendo las migraciones automáticamente.

**Opción B — Node directo:**

```bash
cd backend
cp .env.example .env
npm install
npm run migrate
npm run dev
```

## Despliegue en producción

### Frontend en Vercel

1. Importar el repositorio en [Vercel](https://vercel.com).
2. Configuración del proyecto:
   - **Framework preset:** Astro
   - **Install command:** `npm install`
   - **Build command:** `npm run build`
   - **Output directory:** `dist`
   - **Node.js version:** `22.x`
3. Variables de entorno en Vercel:
   - `PUBLIC_SUPABASE_URL`: URL del proyecto de Supabase.
   - `PUBLIC_SUPABASE_ANON_KEY`: Anon / public API key de Supabase.
   - `PUBLIC_API_URL`: URL pública HTTPS del backend desplegado (ej. `https://runlearn-api.onrender.com`).
4. Agregar el dominio final de Vercel en la lista de Redirect URLs de Supabase (**Authentication → URL Configuration**).

### Backend en Render

El backend está preparado para desplegarse como un **Web Service** en [Render](https://render.com):

1. Crear un Web Service apuntando a la subcarpeta `backend/` (Root Directory: `backend`).
2. Configuración del servicio:
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm run migrate && npm start`
3. Variables de entorno en Render:
   - `NODE_ENV`: `production`
   - `JWT_SECRET`: Secreto aleatorio seguro (`openssl rand -hex 32`).
   - `CORS_ORIGINS`: Dominio de tu frontend en Vercel (ej. `https://runlearn.vercel.app`).
   - `DATABASE_URL`: Connection string URI de PostgreSQL con SSL (ej. desde Supabase: *Project Settings → Database → Connection string URI*).
   - `REDIS_URL`: URL de conexión de Redis con TLS (ej. desde Upstash: *rediss://default:password@host.upstash.io:6379*).

## Contenido y módulos educativos

RunLearn incluye 19 módulos temáticos en `src/data/clases.js`:

- **Arquitectura y APIs:** REST vs GraphQL (`/api-explicacion`), Servidor Linux & Cloud (`/servidor-explicacion`), HTTP/HTTPS (`/http-explicacion`), SSR vs CSR (`/ssr-vs-csr-explicacion`).
- **DevOps y Control:** Docker & Contenedores (`/docker-explicacion`), GitHub y Git (`/github-explicacion`).
- **Seguridad Web & OWASP:** SQL Injection (`/sql-injection-explicacion`), XSS (`/xss-explicacion`), CSRF (`/csrf-explicacion`), CORS (`/cors-explicacion`), Path Traversal (`/path-traversal-explicacion`), JWT Inseguro (`/jwt-inseguro-explicacion`), Password Hashing (`/password-hashing-explicacion`), Botnets & Rate Limiting (`/bots-explicacion`).
- **Persistencia y Rendimiento:** Transacciones ACID (`/transacciones-explicacion`), Caché con Redis (`/cache-redis-explicacion`), Colas de Mensajería (`/colas-explicacion`), Bases de Datos relacionales (`/database-explicacion`).
- **Lógica:** Recursividad (`/recursividad-explicacion`), Algoritmos numéricos (`/algoritmo-numero`).

## Comandos útiles

```bash
# Frontend (raíz)
npm run dev       # Servidor de desarrollo en localhost:4321
npm run build     # Compilación de producción estática a dist/
npm run preview   # Previsualización local del build en dist/

# Backend (carpeta backend/)
npm run dev       # Servidor Express con watch mode en localhost:5000
npm run start     # Iniciar servidor Express en producción
npm run migrate   # Ejecutar migraciones SQL pendientes
```

