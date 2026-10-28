# Hoja de Ruta Técnica de RunLearn (ROADMAP_IA.md)

Este documento define la **visión de producto, dirección técnica y hoja de ruta de nuevas tecnologías** para RunLearn. Es la guía temática y de producto para cualquier agente de IA o desarrollador que colabore en el proyecto. Complementa a [`AGENTS.md`](AGENTS.md), que establece las reglas de arquitectura y código.

---

## 1. Visión y Filosofía de Producto

**RunLearn NO es un LMS ni un Google Classroom tradicional.** No fue creado para administrar listas de alumnos, cursos cerrados ni calificaciones formales.

RunLearn es un **laboratorio técnico interactivo y aula visual de ingeniería de software** con una filosofía inquebrantable:
- **Hacer visible lo invisible:** Los desarrolladores no aprenden con diapositivas teóricas aburridas; aprenden viendo los paquetes HTTP viajar, las consultas SQL compilarse y bloquearse, los tokens de un balde de rate limiting agotarse, los contenedores Docker aislar procesos y los estados de caché Redis alternar entre HIT y MISS.
- **Cero magia:** Cada módulo desglosa minuciosamente qué sucede en el cliente, en la red, en el backend y en la base de datos.
- **Acceso abierto y autónomo:** Toda persona puede navegar, simular, aprender y autoevaluarse libremente.

---

## 2. Catálogo Actual de Módulos (23 Clases)

El catálogo unificado en `src/data/clases.js` abarca 9 categorías temáticas:

1. **Seguridad:**
   - Rate Limiting (Token Bucket, cabeceras `X-RateLimit-*`, HTTP 429).
   - JWT Inseguro (Bypass algoritmo `none`, secretos débiles).
   - SQL Injection (Consultas concatenadas vulnerables vs parametrizadas `$1, $2`).
   - XSS (Cross-Site Scripting reflejado/almacenado y sanitización).
   - CSRF (Cross-Site Request Forgery y tokens anti-falsificación).
   - CORS (Same-Origin Policy y cabeceras `Access-Control-Allow-Origin`).
   - Hashing de Contraseñas (bcrypt, salt rounds, funciones de costo vs MD5/SHA).
   - Path Traversal (Escape de directorios con `../` vs validación canónica de rutas).
2. **Backend:**
   - API REST (CRUD interactivo con Express y PostgreSQL).
   - SSR vs CSR (Server-Side Rendering vs Client-Side Rendering y First Contentful Paint).
   - Colas de Mensajes (Workers asíncronos y desacoplamiento).
   - Transacciones SQL (Propiedades ACID, `BEGIN`, `COMMIT` y `ROLLBACK`).
3. **Almacén:**
   - Base de Datos (Motor relacional, tablas, índices y persistencia).
   - Caché con Redis (Estrategia Cache-Aside, estados HIT y MISS, TTL).
4. **Redes:**
   - HTTP / HTTPS (Handshake TLS, métodos, códigos de estado y cabeceras).
   - DNS (Resolución jerárquica desde caché del navegador hasta el servidor autoritativo).
   - WebSockets (Handshake HTTP 101 Switching Protocols y canal bidireccional en vivo).
5. **DevOps:**
   - Docker (Imágenes, contenedores aislados, volúmenes y namespaces Linux).
   - CI/CD con GitHub Actions (Triggers, runners, jobs, validación y despliegue continuo).
6. **Sistema:**
   - Servidor (Métricas en memoria, latencias, peticiones concurrentes y healthcheck).
7. **Control:**
   - GitHub (Working Directory, Staging Area, Commits y Push remoto interactivo).
8. **Automatización:**
   - Bots (Scrapers, mitigación de ráfagas y simulación de tráfico).
9. **Lógica:**
   - Algoritmo de número (Búsqueda binaria vs secuencial).
   - Recursividad (Call Stack, caso base y desbordamiento de pila).

---

## 3. Hoja de Ruta de Nuevas Tecnologías a Agregar

Para seguir enriqueciendo RunLearn como el playground interactivo de referencia, las próximas tecnologías a implementar son:

### Prioridad Alta:
- **OAuth 2.0 & OpenID Connect (PKCE):**
  - Visualizar el flujo de autorización: Authorization Code Grant con PKCE (`code_verifier`, `code_challenge`), redirección, intercambio de código por Access & ID Tokens.
- **GraphQL vs REST:**
  - Demostrar el problema de *Over-fetching* y *Under-fetching*. Visualizar un único endpoint `POST /graphql` con árbol de resolvers y selección precisa de campos.
- **Database Indexing & B-Trees:**
  - Comparar visualmente un Sequential Scan ($O(N)$) vs B-Tree Index Scan ($O(\log N)$) recorriendo niveles de nodos con millones de registros.
- **Kafka & Event Streaming:**
  - Visualizar particiones de topics, productores publicando eventos y consumidores leyendo secuencialmente mediante su `offset`.

### Prioridad Media:
- **Algoritmos de Balanceo de Carga (Load Balancing):**
  - Visualizar un balanceador distribuyendo peticiones a 3 servidores mediante Round Robin, Least Connections e IP Hash, con simulación de servidor caído (*Health Check Fail*).
- **WebRTC y Handshake P2P:**
  - Cómo dos navegadores se conectan directamente sin pasar por el servidor usando servidores STUN/TURN y ofertas/respuestas SDP.
- **Docker Compose & Redes Internas:**
  - Simular cómo dos contenedores (app y db) se descubren mutuamente a través del DNS interno de una red bridge sin exponer puertos al exterior.
- **Sharding y Replicación de Base de Datos:**
  - Visualizar replicación maestro-esclavo (Read Replicas) y particionamiento horizontal por hash de clave de cliente.

---

## 4. Patrón Estructural Obligatorio para Nuevas Clases

Toda nueva clase debe seguir el patrón de diseño y calidad establecido en `AGENTS.md`:
1. **Diagrama o Canvas Interactivo:** Visualización animada en tiempo real de los nodos que intervienen en el flujo técnico.
2. **Consola y Visor de Código:** Código real con resaltado de sintaxis y terminal que muestre cabeceras HTTP, queries SQL o comandos terminales.
3. **Controles y Modos Interactivos:** Botones para disparar eventos (ej. ráfagas, inyecciones, errores intencionales) y ver la reacción del sistema.
4. **Resiliencia y Audio:**
   - Consumir endpoints de backend mediante `src/lib/apiClient.js` con fallback interactivo en cliente si el backend está apagado.
   - Efectos sonoros vía Web Audio API (`src/lib/soundControls.js`).
   - Integración con el cuestionario pedagógico (`src/data/preguntasClases.js` y `LessonCompletion.astro`).
5. **Registro:** Registrar el nuevo módulo en `src/data/clases.js`, icono en `src/components/ClassIcon.astro` y ruta en `src/pages/`.
