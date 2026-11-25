import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser / same-origin requests (no Origin header)
      if (!origin) {
        callback(null, true);
        return;
      }

      const allowed = config.corsOrigins.some((entry) => {
        if (typeof entry === 'string') return entry === origin;
        return entry.test(origin);
      });

      // Chrome extension pages send chrome-extension:// origins
      if (allowed || origin.startsWith('chrome-extension://')) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    methods: ['GET', 'POST', 'PUT', 'OPTIONS'],
  })
);
app.use(express.json());

app.use('/api', routes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`[SCF Backend] listening on http://localhost:${config.port}`);
  console.log(`[SCF Backend] health: http://localhost:${config.port}/api/health`);
  console.log(
    `[SCF Backend] filters: http://localhost:${config.port}/api/filters/prime-title-001`
  );
});

export default app;
