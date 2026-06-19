import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import { initIO } from './lib/socket';
import { reconcileIndependentDispatch } from './services/dispatchService';
import { startReminderScheduler } from './services/reminderService';

import authRouter     from './routes/auth';
import publicRouter   from './routes/public';
import adminRouter    from './routes/admin';
import financeRouter  from './routes/finance';
import opsRouter      from './routes/ops';
import affiliateRouter from './routes/affiliate';
import driverRouter   from './routes/driver';
import customerRouter from './routes/customer';

import { notFound, errorHandler } from './middleware/errorHandler';

const app    = express();
const server = createServer(app);
const PORT   = process.env.PORT ? parseInt(process.env.PORT) : 4000;
initIO(server);

let dispatchReconciliationRunning = false;
async function reconcileDispatch() {
  if (dispatchReconciliationRunning) return;
  dispatchReconciliationRunning = true;
  try {
    await reconcileIndependentDispatch();
  } catch (error) {
    console.error('Dispatch reconciliation failed:', error);
  } finally {
    dispatchReconciliationRunning = false;
  }
}

// ─── Security & Parsing ───────────────────────────────────────────────────────

// Disable helmet entirely for /api-docs so Swagger UI JS/CSS loads fully
app.use((req, res, next) => {
  if (req.path.startsWith('/api-docs') || req.path === '/api-spec.json') return next();
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: false,
  })(req, res, next);
});
app.use(cors({ origin: '*', methods: ['GET','POST','PUT','DELETE','PATCH','OPTIONS'], allowedHeaders: ['Content-Type','Authorization'] }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

// ─── Rate Limiting ────────────────────────────────────────────────────────────

app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 500, message: { success: false, message: 'Too many requests, please try again later.' } }));

// ─── Swagger / OpenAPI Docs ───────────────────────────────────────────────────

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Ride Prestige — Corporate Backend API',
      version: '1.0.0',
      description: `
## Full corporate backend for Ride Prestige

A private hire & coach transport platform based in Sheffield, UK.

### Portals
| Portal | Role |
|---|---|
| Admin | \`admin\` |
| Operations | \`ops\` |
| Affiliate | \`affiliate\` |
| Driver | \`driver\` |
| Customer | \`customer\` |

### Authentication
All protected routes require a Bearer JWT token.
1. Call \`POST /api/auth/login\` with email, password, and role.
2. Copy the \`token\` from the response.
3. Click **Authorise** (lock icon) and enter \`Bearer <token>\`.

### Business Logic
- **Fare calculation**: Mileage × rate + time charge (varies by vehicle category)
- **Commission**: Ride Prestige commission is deducted from the customer fare; affiliates and independent drivers receive the remaining partner payout
- **Ride lifecycle**: awaiting_affiliate → needs_allocation → driver_assigned → vehicle_assigned → driver_accepted → on_route → arrived_pickup → passenger_onboard → in_progress → completed
      `,
    },
    servers: [{ url: `http://localhost:${PORT}`, description: 'Local dev server' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    tags: [
      { name: 'Auth',       description: 'Authentication for all portal roles' },
      { name: 'Public',     description: 'Public endpoints — no auth required' },
      { name: 'Admin',      description: 'Admin portal — full platform management' },
      { name: 'Operations', description: 'Operations portal — ride & fleet oversight' },
      { name: 'Affiliate',  description: 'Affiliate portal — jobs, drivers, vehicles' },
      { name: 'Driver',     description: 'Driver portal — ride flow & earnings' },
      { name: 'Customer',   description: 'Customer portal — bookings & profile' },
    ],
  },
  apis: [path.join(__dirname, 'routes', '*.ts'), path.join(__dirname, 'routes', '*.js')],
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Ride Prestige API Docs',
  customCss: `
    .swagger-ui .topbar { background-color: #000000; }
    .swagger-ui .topbar-wrapper img { display: none; }
    .swagger-ui .topbar-wrapper::after { content: "RIDE PRESTIGE API"; color: #c9a84c; font-weight: bold; font-size: 1.2rem; padding: 12px 0; display: block; }
    .swagger-ui .btn.execute { background-color: #c9a84c; border-color: #c9a84c; }
    .swagger-ui .btn.authorize { border-color: #c9a84c; color: #c9a84c; }
  `,
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    tryItOutEnabled: true,
    defaultModelsExpandDepth: -1,
    docExpansion: 'list',
  },
}));

// Serve the raw spec as JSON for tooling integration
app.get('/api-spec.json', (_req, res) => res.json(swaggerSpec));

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use('/api/auth',      authRouter);
app.use('/api/public',    publicRouter);
app.use('/api/admin/finance', financeRouter);
app.use('/api/admin',     adminRouter);
app.use('/api/ops',       opsRouter);
app.use('/api/affiliate', affiliateRouter);
app.use('/api/driver',    driverRouter);
app.use('/api/customer',  customerRouter);

// ─── Health Check ─────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'Ride Prestige API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV ?? 'development',
  });
});

// Serve portal web pages
app.use(express.static(path.join(__dirname, '..', 'public')));

// ─── Error Handlers ───────────────────────────────────────────────────────────

app.use(notFound);
app.use(errorHandler);

// ─── Start ────────────────────────────────────────────────────────────────────

server.listen(PORT, () => {
  void reconcileDispatch();
  setInterval(() => void reconcileDispatch(), 30_000).unref();
  startReminderScheduler();
  console.log('');
  console.log('  ╔══════════════════════════════════════════════════════╗');
  console.log('  ║         RIDE PRESTIGE — CORPORATE BACKEND API        ║');
  console.log('  ╠══════════════════════════════════════════════════════╣');
  console.log(`  ║  Server  : http://localhost:${PORT}                      ║`);
  console.log(`  ║  API Docs: http://localhost:${PORT}/api-docs              ║`);
  console.log(`  ║  Health  : http://localhost:${PORT}/health                ║`);
  console.log('  ╠══════════════════════════════════════════════════════╣');
  console.log('  ║  Production credentials are managed privately         ║');
  console.log('  ║  Do not expose portal passwords in public logs        ║');
  console.log('  ╚══════════════════════════════════════════════════════╝');
  console.log('');
});

export { app, server };
export default app;
