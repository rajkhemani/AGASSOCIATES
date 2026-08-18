import pino from 'pino';
import { randomUUID } from 'crypto';

// Create base logger
const isProduction = process.env.NODE_ENV === 'production';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: isProduction ? undefined : {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  },
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {
    service: 'ag-platform',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  },
});

// Child logger with context
export function createChildLogger(context: Record<string, any>) {
  return logger.child(context);
}

// Request logger with correlation ID
export function createRequestLogger(requestId: string, correlationId?: string) {
  return logger.child({
    requestId,
    correlationId: correlationId || requestId,
  });
}

// Structured logging helpers
export function logRequest(log: pino.Logger, req: any, duration?: number) {
  log.info({
    method: req.method,
    url: req.url,
    query: req.query,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    duration,
  }, 'HTTP request');
}

export function logResponse(log: pino.Logger, statusCode: number, duration: number) {
  log.info({
    statusCode,
    duration,
  }, 'HTTP response');
}

export function logError(log: pino.Logger, error: Error, context?: Record<string, any>) {
  log.error({
    err: error,
    ...context,
  }, 'Error occurred');
}

export function logAgentAction(log: pino.Logger, agent: string, action: string, data?: Record<string, any>) {
  log.info({
    agent,
    action,
    ...data,
  }, 'Agent action');
}

export function logWorkflowTransition(log: pino.Logger, workflow: string, fromState: string, toState: string, caseId: string) {
  log.info({
    workflow,
    fromState,
    toState,
    caseId,
  }, 'Workflow transition');
}

export function logRPAAction(log: pino.Logger, portal: string, action: string, caseId: string, data?: Record<string, any>) {
  log.info({
    portal,
    action,
    caseId,
    ...data,
  }, 'RPA action');
}

export function logLLMCall(log: pino.Logger, agent: string, model: string, tokensIn: number, tokensOut: number, duration: number) {
  log.info({
    agent,
    model,
    tokensIn,
    tokensOut,
    duration,
  }, 'LLM call');
}

export function logDBQuery(log: pino.Logger, query: string, duration: number, rows: number) {
  log.debug({
    query: query.substring(0, 500),
    duration,
    rows,
  }, 'DB query');
}

// Express middleware for request logging
export function requestLoggingMiddleware() {
  return (req: any, res: any, next: any) => {
    const requestId = req.headers['x-request-id'] || randomUUID();
    const correlationId = req.headers['x-correlation-id'] || requestId;

    req.requestId = requestId;
    req.correlationId = correlationId;

    const log = createRequestLogger(requestId, correlationId);

    const startTime = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      logResponse(log, res.statusCode, duration);
    });

    logRequest(log, req);

    next();
  };
}

// Error logging middleware
export function errorLoggingMiddleware() {
  return (err: any, req: any, res: any, next: any) => {
    const log = req.correlationId
      ? createRequestLogger(req.requestId, req.correlationId)
      : logger;

    logError(log, err, {
      path: req.path,
      method: req.method,
      statusCode: err.status || 500,
    });

    next(err);
  };
}