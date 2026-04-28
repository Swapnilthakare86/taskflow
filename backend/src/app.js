'use strict';
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const routes = require('./routes');
const errorMiddleware = require('./middleware/errorMiddleware');
const AppError = require('./utils/AppError');
const { CLIENT_URL } = require('./config/env');

const app = express();

app.use(helmet());
const explicitOrigins = new Set([
  CLIENT_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]);

const lanDevOriginPattern = /^http:\/\/(?:10|127|169\.254|172\.(?:1[6-9]|2\d|3[0-1])|192\.168)\.\d{1,3}\.\d{1,3}:(?:5173|4173)$/;

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (explicitOrigins.has(origin) || lanDevOriginPattern.test(origin)) {
        return callback(null, true);
      }
      return callback(new AppError(`Origin not allowed by CORS: ${origin}`, 403));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));

app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'taskflow-backend' });
});

app.use('/api/v1', routes);
app.use((_req, _res, next) => next(new AppError('Route not found', 404)));
app.use(errorMiddleware);

module.exports = app;
