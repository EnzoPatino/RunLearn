import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth.routes.js';
import healthRouter from './routes/health.routes.js';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/auth', authRouter);
app.use('/api/health', healthRouter);

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
      health: '/api/health',
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
