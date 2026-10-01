import express, { type Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routingRouter from './modules/routing/routing.routes.ts';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Root greeting endpoint
app.get('/', (_req, res) => {
  res.json({
    message: 'Smart Parking Recommendation API',
    status: 'running',
    healthCheck: '/api/health',
  });
});

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routing & Navigation Module (Owner: Xavier — FR21-FR23, FR28-FR34)
app.use('/api/routes', routingRouter);

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});

export default app;
