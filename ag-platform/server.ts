import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import crypto from "crypto";
import caseRoutes from "./src/server/routes/cases.ts";
import timesheetRoutes from "./src/server/routes/timesheets.ts";
import documentRoutes from "./src/server/routes/documents.ts";
import dashboardRoutes from "./src/server/routes/dashboard.ts";
import neslRoutes from "./src/server/routes/nesl.ts";
import authRoutes from "./src/server/routes/auth.ts";
import invoiceRoutes from "./src/server/routes/invoices.ts";

// Sentry error tracking (optional, requires SENTRY_DSN env)
import { initSentry, Sentry } from "./src/server/sentry.ts";

// Structured logging
import { logger, requestLoggingMiddleware, errorLoggingMiddleware } from "./src/server/logger.ts";

// Metrics
import { metricsMiddleware, metricsHandler, setDbPoolConnections } from "./src/server/metrics.ts";

// OpenAPI
import { setupOpenAPI, openAPISpec } from "./src/server/openapi.ts";

// Load environment variables
dotenv.config();
initSentry();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// We'll import AI API routes from another file to keep it clean
import aiRoutes from "./src/server/aiRouter.ts";
import { pool } from "./src/server/db.ts";

// API Version
const API_VERSION = "v1";
const API_PREFIX = `/api/${API_VERSION}`;

// CORS Configuration - Strict allowlist for production
const corsOrigins = process.env.CORS_ORIGINS?.split(',').map(o => o.trim()) || [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://luxor9-legalos.vercel.app',
];

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin) return callback(null, true); // Allow non-browser requests
    if (corsOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-Org-ID'],
  maxAge: 86400, // 24 hours
};

async function runMigrations() {
  try {
    const migrationPath = path.join(process.cwd(), "src/server/migrations.sql");
    const sql = fs.readFileSync(migrationPath, "utf8");
    await pool.query(sql);
    logger.info("Database migrations completed successfully");
  } catch (error) {
    logger.error({ err: error }, "Migration failed");
  }
}

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || "3001", 10);

  await runMigrations();

  // Add trust proxy for rate limiting behind a reverse proxy
  app.set("trust proxy", 1);

  app.use(cors(corsOptions));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // Sentry request handler (must be before other middleware/routes)
  app.use(Sentry.Handlers.requestHandler());

  // Structured request logging
  app.use(requestLoggingMiddleware());

  // Metrics middleware
  app.use(metricsMiddleware());

  // Add Request ID
  app.use((req, res, next) => {
    req.headers['x-request-id'] = req.headers['x-request-id'] || crypto.randomUUID();
    res.setHeader('X-Request-ID', req.headers['x-request-id']);
    next();
  });

  // Global rate limiter
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: { error: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later.' } },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(globalLimiter);

  // Stricter rate limiter for auth endpoints
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { error: { code: 'RATE_LIMITED', message: 'Too many authentication attempts, please try again later.' } },
  });

  // Stricter rate limiter for webhook endpoints
  const webhookLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    message: { error: { code: 'RATE_LIMITED', message: 'Webhook rate limit exceeded.' } },
  });

  // Rate Limiting for AI Routes
  const aiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: { code: 'RATE_LIMITED', message: "Too many requests to AI services, please try again later." } },
  });

  // Monitor DB pool
  pool.on('acquire', () => setDbPoolConnections(pool.totalCount - pool.idleCount, pool.idleCount));
  pool.on('release', () => setDbPoolConnections(pool.totalCount - pool.idleCount, pool.idleCount));

  // Setup OpenAPI
  setupOpenAPI(app, API_PREFIX);

  // Health check (no version prefix)
  app.get("/api/health", async (req, res) => {
    let dbStatus = "unknown";
    try {
      const dbRes = await pool.query('SELECT 1 as result');
      if (dbRes.rows.length > 0) {
        dbStatus = "connected";
      }
    } catch (e) {
      logger.error({ err: e }, "Database connection failed");
      dbStatus = "disconnected";
    }
    res.json({ status: "ok", database: dbStatus, version: API_VERSION });
  });

  // Deep health check
  app.get("/api/health/deep", async (req, res) => {
    const checks = {
      database: "unknown",
      supabase: "unknown",
    };

    try {
      await pool.query('SELECT 1 as result');
      checks.database = "healthy";
    } catch (e) {
      checks.database = `unhealthy: ${String(e).substring(0, 100)}`;
    }

    try {
      const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
      if (supabaseUrl && supabaseKey) {
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
          headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }
        });
        if (response.ok || response.status === 401) {
          checks.supabase = "healthy";
        } else {
          checks.supabase = `unhealthy: HTTP ${response.status}`;
        }
      } else {
        checks.supabase = "not_configured";
      }
    } catch (e) {
      checks.supabase = `unhealthy: ${String(e).substring(0, 100)}`;
    }

    const allHealthy = Object.values(checks).every(v => v === "healthy" || v === "not_configured");

    res.json({
      status: allHealthy ? "healthy" : "degraded",
      checks,
      timestamp: new Date().toISOString(),
    });
  });

  // Prometheus metrics endpoint
  app.get("/metrics", metricsHandler);

  // Webhook endpoints with stricter rate limiting
  app.post("/api/webhooks/virus-scan", webhookLimiter, async (req, res) => {
    try {
      const { bucketId, filePath } = req.body;
      logger.info({ bucketId, filePath }, "Virus scan webhook received");
      res.json({ status: "ok", safe: true });
    } catch (e) {
      res.status(500).json({ error: "Virus scan failed" });
    }
  });

  // Auth routes (login, register, logout, me) - with auth rate limiting
  app.use(`${API_PREFIX}/auth`, authLimiter, authRoutes);

  // Protected routes - require authentication
  app.use(API_PREFIX, caseRoutes);
  app.use(API_PREFIX, timesheetRoutes);
  app.use(API_PREFIX, documentRoutes);
  app.use(API_PREFIX, dashboardRoutes);
  app.use(API_PREFIX, neslRoutes);
  app.use(API_PREFIX, invoiceRoutes);

  app.use(`${API_PREFIX}/ai`, aiLimiter, aiRoutes);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
      root: path.join(process.cwd(), "apps/web"),
    });
    app.use(vite.middlewares);
  } else {
    // Production serving
    const distPath = path.join(process.cwd(), "apps/web/dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Sentry error handler (must be after all routes, before other error handlers)
  app.use(Sentry.Handlers.errorHandler());

  // Structured error logging
  app.use(errorLoggingMiddleware());

  // Global Structured Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    const requestId = req.headers['x-request-id'];
    logger.error({ err: err, requestId }, `System Error: ${err.message}`);

    const statusCode = err.status || 500;
    const isClientError = statusCode >= 400 && statusCode < 500;

    res.status(statusCode).json({
      error: {
        code: isClientError ? err.code || 'BAD_REQUEST' : 'SYSTEM_ERROR',
        message: isClientError ? err.message : 'An internal system error occurred. Please try again later.',
        requestId
      }
    });
  });

  app.listen(PORT, "0.0.0.0", () => {
    logger.info({ port: PORT, apiVersion: API_VERSION }, `Server running on http://localhost:${PORT}`);
  });
}

startServer();