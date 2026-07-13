import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { config } from './config';
import { errorHandler } from './middleware/error.middleware';
import { NotFoundError } from './utils/errors';
import { generalLimiter } from './middleware/rateLimit.middleware';
import { initCronJobs } from './jobs/maturity.job';
import router from './routes';

const app: Application = express();

// Security HTTP headers
app.use(helmet());

// Enable Cross-Origin Resource Sharing
app.use(cors({
  origin: config.CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Compression for response payloads
app.use(compression());

// Request logging in development/production mode
if (config.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Parse incoming JSON requests
app.use(express.json());

// Global Rate Limiter
app.use(generalLimiter);

// Register API v1 routes
app.use('/api/v1', router);

// Catch-all route to handle 404 resource errors
app.use((req, res, next) => {
  next(new NotFoundError(`Route ${req.originalUrl} not found on this server.`));
});

// Centralized error handling middleware
app.use(errorHandler);

// Initialize background cron jobs (maturity & valuation updates)
initCronJobs();

const PORT = config.PORT;

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running in ${config.NODE_ENV} mode on port ${PORT}`);
});

export default app;
