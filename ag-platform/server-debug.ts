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
import bankPortalRoutes from "./src/server/routes/bankPortal.ts";

dotenv.config();

console.log('[1] Environment loaded');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
console.log('[2] __dirname:', __dirname);

import aiRoutes from "./src/server/aiRouter.ts";
import { pool } from "./src/server/db.ts";
console.log('[3] Imports loaded');

const API_VERSION = "v1";
const API_PREFIX = `/api/${API_VERSION}`;

const corsOrigins = process.env.CORS_ORIGINS?.split(',').map(o => o.trim()) || [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://luxor9-legalos.vercel.app',
];

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin) return callback(null, true);
    if (corsOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-Org-ID'],
  maxAge: 86400,
};

async function runMigrations() {
  console.log('[runMigrations] Starting...');
  try {
    const migrationPath = path.join(process.cwd(), "src/server/migrations.sql");
    console.log('[runMigrations] Reading file:', migrationPath);
    const sql = fs.readFileSync(migrationPath, "utf8");
    console.log('[runMigrations] Executing query...');
    await pool.query(sql);
    console.log('[runMigrations] Completed successfully');
  } catch (error) {
    console.error('[runMigrations] Failed:', error);
  }
}

async function startServer() {
  console.log('[startServer] Creating express app...');
  const app = express();
  const PORT = parseInt(process.env.PORT || "3001", 10);
  console.log('[startServer] Port:', PORT);

  console.log('[startServer] Running migrations...');
  await runMigrations();
  console.log('[startServer] Migrations done');

  app.set("trust proxy", 1);
  app.use(cors(corsOptions));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());
  console.log('[startServer] Middleware loaded');

  app.use((req, res, next) => {
    req.headers['x-request-id'] = req.headers['x-request-id'] || crypto.randomUUID();
    res.setHeader('X-Request-ID', req.headers['x-request-id']);
    next();
  });

  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: { error: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later.' } },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(globalLimiter);

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { error: { code: 'RATE_LIMITED', message: 'Too many authentication attempts, please try again later.' } },
  });

  const webhookLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    message: { error: { code: 'RATE_LIMITED', message: 'Webhook rate limit exceeded.' } },
  });

  const aiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: { code: 'RATE_LIMITED', message: "Too many requests to AI services, please try again later." } },
  });

  app.get("/api/health", async (req, res) => {
    let dbStatus = "unknown";
    try {
      const dbRes = await pool.query('SELECT 1 as result');
      if (dbRes.rows.length > 0) {
        dbStatus = "connected";
      }
    } catch (e) {
      dbStatus = "disconnected";
    }
    res.json({ status: "ok", database: dbStatus, version: API_VERSION });
  });

  app.use(`${API_PREFIX}/auth`, authLimiter, authRoutes);
  app.use(API_PREFIX, caseRoutes);
  app.use(API_PREFIX, timesheetRoutes);
  app.use(API_PREFIX, documentRoutes);
  app.use(API_PREFIX, dashboardRoutes);
  app.use(API_PREFIX, neslRoutes);
  app.use(API_PREFIX, invoiceRoutes);
  app.use(API_PREFIX, bankPortalRoutes);
  app.use(`${API_PREFIX}/ai`, aiLimiter, aiRoutes);
  console.log('[startServer] Routes registered');

  if (process.env.NODE_ENV !== "production") {
    console.log('[startServer] Loading Vite middleware...');
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
      root: path.join(process.cwd(), "apps/web"),
    });
    app.use(vite.middlewares);
    console.log('[startServer] Vite middleware loaded');
  } else {
    const distPath = path.join(process.cwd(), "apps/web/dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    const requestId = req.headers['x-request-id'];
    console.error({ err: err, requestId }, `System Error: ${err.message}`);

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
    console.log(`Server running on http://localhost:${PORT}`);
  });

  const shutdown = async () => {
    console.log('Shutting down server...');
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

console.log('[main] Starting server...');
startServer().catch(console.error);