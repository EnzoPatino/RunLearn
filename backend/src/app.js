import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth.routes.js';
import healthRouter from './routes/health.routes.js';
import metricsRouter from './routes/metrics.routes.js';
import peopleRouter from './routes/people.js';
import cacheDemoRouter from './routes/cache-demo.js';
import transaccionDemoRouter from './routes/transaccion-demo.js';
import { trackRequest } from './metrics.js';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(trackRequest);

// Rutas
app.use('/api/auth', authRouter);
app.use('/api/health', healthRouter);
app.use('/api/metrics', metricsRouter);
app.use('/api/people', peopleRouter);
app.use('/api/cache-demo', cacheDemoRouter);
app.use('/api/transaccion-demo', transaccionDemoRouter);

app.get('/', (req, res) => {
  res.json({
    name: 'RunLearn API',
    version: '1.0.0',
    endpoints: {
      auth: {
        register: '/api/auth/register',
        login: '/api/auth/login',
        me: '/api/auth/me',
      },
      people: {
        list: 'GET /api/people',
        get: 'GET /api/people/:id',
        create: 'POST /api/people',
        update: 'PUT /api/people/:id',
        delete: 'DELETE /api/people/:id',
      },
      health: '/api/health',
      metrics: '/api/metrics',
    },
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('[Error no controlado]:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

export default app;
