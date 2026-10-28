import { Router } from 'express';

const router = Router();

// Base de datos de ejemplo en memoria
const MOCK_AUTHOR = {
  id: 1,
  nombre: 'Sofía Valenzuela',
  email: 'sofia.valenzuela@runlearn.dev',
  rol: 'Senior Backend Engineer',
  avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
  bio: 'Especialista en arquitecturas distribuidas, APIs de alta concurrencia y PostgreSQL.',
  ubicacion: 'Buenos Aires, Argentina',
  empresa: 'RunLearn Labs',
  sitioWeb: 'https://sofia.dev',
  twitter: '@sofia_val',
  github: 'sofiaval',
  creadoEn: '2023-01-15T08:30:00Z',
  actualizadoEn: '2026-10-20T14:22:00Z',
  preferencias: {
    tema: 'dark',
    notificacionesEmail: true,
    newsletter: false,
    idioma: 'es-AR',
    zonaHoraria: 'America/Argentina/Buenos_Aires',
  },
  articulos: [
    {
      id: 101,
      titulo: 'Mitigando ataques DDoS con Token Bucket',
      slug: 'mitigando-ddos-token-bucket',
      resumen: 'Cómo proteger APIs de alta frecuencia con algoritmos de tasa en Redis.',
      contenidoExtenso: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris...',
      leidoMinutos: 6,
      publicadoEn: '2026-09-12',
      vistas: 4820,
      likes: 342,
    },
    {
      id: 102,
      titulo: 'De REST a GraphQL: Lecciones en producción',
      slug: 'de-rest-a-graphql-lecciones',
      resumen: 'Análisis de payload, latencia y complejidad en arquitecturas móviles.',
      contenidoExtenso: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident...',
      leidoMinutos: 9,
      publicadoEn: '2026-10-04',
      vistas: 8950,
      likes: 620,
    },
  ],
};

// POST /query - Ejecución de GraphQL simulada con filtrado dinámico de campos
router.post('/query', (req, res) => {
  const { fields = ['nombre', 'email'], includeArticles = true, articleFields = ['titulo'] } = req.body || {};

  const result = { data: { author: {} } };

  // Resolver campos del autor
  fields.forEach((field) => {
    if (field in MOCK_AUTHOR && field !== 'articulos') {
      result.data.author[field] = MOCK_AUTHOR[field];
    }
  });

  // Resolver artículos anidados si se solicitaron
  if (includeArticles) {
    result.data.author.articulos = MOCK_AUTHOR.articulos.map((art) => {
      const artObj = {};
      articleFields.forEach((af) => {
        if (af in art) artObj[af] = art[af];
      });
      return artObj;
    });
  }

  const jsonStr = JSON.stringify(result);
  const byteSize = Buffer.byteLength(jsonStr, 'utf8');

  return res.json({
    mode: 'graphql',
    httpRequests: 1,
    endpoint: 'POST /graphql',
    byteSize,
    simulatedLatencyMs: 28,
    data: result.data,
    meta: {
      overfetchingBytesAvoided: Math.max(0, 3450 - byteSize),
      roundTripsSaved: 2,
    },
  });
});

// GET /rest - Simulación del enfoque REST tradicional (Over-fetching + N+1)
router.get('/rest', (req, res) => {
  // En REST el cliente llama a /api/authors/1 y recibe TODO el autor
  // Luego llama a /api/authors/1/articulos y recibe todos los artículos completos
  const restPayload = {
    step1_author: MOCK_AUTHOR,
    step2_articles: MOCK_AUTHOR.articulos,
  };

  const jsonStr = JSON.stringify(restPayload);
  const byteSize = Buffer.byteLength(jsonStr, 'utf8');

  return res.json({
    mode: 'rest',
    httpRequests: 3, // GET /author, GET /articles, GET /stats
    endpoints: [
      'GET /api/authors/1',
      'GET /api/authors/1/articles',
      'GET /api/articles/101/stats',
    ],
    byteSize,
    simulatedLatencyMs: 145, // 3 viajes de ida y vuelta
    data: restPayload,
    meta: {
      issue: 'Over-fetching masivo + 3 peticiones secuenciales (N+1)',
    },
  });
});

export default router;
