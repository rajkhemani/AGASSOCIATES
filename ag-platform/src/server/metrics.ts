import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

// Create registry
export const registry = new Registry();

// Add default metrics (CPU, memory, etc.)
collectDefaultMetrics({ register: registry, prefix: 'ag_platform_' });

// HTTP Metrics
export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'endpoint', 'status'],
  registers: [registry],
});

export const httpRequestDurationSeconds = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request latency in seconds',
  labelNames: ['method', 'endpoint'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
  registers: [registry],
});

// Database Metrics
export const dbQueriesTotal = new Counter({
  name: 'db_queries_total',
  help: 'Total database queries',
  labelNames: ['query_type', 'status'],
  registers: [registry],
});

export const dbQueryDurationSeconds = new Histogram({
  name: 'db_query_duration_seconds',
  help: 'Database query latency in seconds',
  labelNames: ['query_type'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2],
  registers: [registry],
});

export const dbPoolConnections = new Gauge({
  name: 'db_pool_connections',
  help: 'Database pool connections',
  labelNames: ['state'],
  registers: [registry],
});

// AI Metrics
export const aiCallsTotal = new Counter({
  name: 'ai_calls_total',
  help: 'Total AI API calls',
  labelNames: ['endpoint', 'model', 'status'],
  registers: [registry],
});

export const aiTokensTotal = new Counter({
  name: 'ai_tokens_total',
  help: 'Total AI tokens used',
  labelNames: ['endpoint', 'model', 'type'],
  registers: [registry],
});

export const aiCallDurationSeconds = new Histogram({
  name: 'ai_call_duration_seconds',
  help: 'AI API call latency in seconds',
  labelNames: ['endpoint', 'model'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],
  registers: [registry],
});

// Business Metrics
export const casesTotal = new Counter({
  name: 'cases_total',
  help: 'Total cases created',
  labelNames: ['case_type', 'status'],
  registers: [registry],
});

export const casesActive = new Gauge({
  name: 'cases_active',
  help: 'Number of active cases',
  labelNames: ['case_type'],
  registers: [registry],
});

export const workflowTransitionsTotal = new Counter({
  name: 'workflow_transitions_total',
  help: 'Total workflow state transitions',
  labelNames: ['workflow', 'from_state', 'to_state'],
  registers: [registry],
});

export const disbursementsTotal = new Counter({
  name: 'disbursements_total',
  help: 'Total disbursements',
  labelNames: ['type', 'status'],
  registers: [registry],
});

export const timesheetsTotal = new Counter({
  name: 'timesheets_total',
  help: 'Total timesheets logged',
  labelNames: ['status'],
  registers: [registry],
});

// Error Metrics
export const errorsTotal = new Counter({
  name: 'errors_total',
  help: 'Total errors',
  labelNames: ['component', 'error_type'],
  registers: [registry],
});

// System Info
export const systemInfo = new Gauge({
  name: 'system_info',
  help: 'System information',
  labelNames: ['version', 'environment'],
  registers: [registry],
});

systemInfo.labels({
  version: process.env.npm_package_version || '1.0.0',
  environment: process.env.NODE_ENV || 'development',
}).set(1);

// Helper functions
export function recordHttpRequest(method: string, endpoint: string, statusCode: number, duration: number) {
  httpRequestsTotal.inc({ method, endpoint, status: String(statusCode) });
  httpRequestDurationSeconds.observe({ method, endpoint }, duration);
}

export function recordDbQuery(queryType: string, success: boolean, duration: number) {
  dbQueriesTotal.inc({ query_type: queryType, status: success ? 'success' : 'failure' });
  dbQueryDurationSeconds.observe({ query_type: queryType }, duration);
}

export function recordAICall(endpoint: string, model: string, success: boolean, tokensIn: number, tokensOut: number, duration: number) {
  aiCallsTotal.inc({ endpoint, model, status: success ? 'success' : 'failure' });
  aiTokensTotal.inc({ endpoint, model, type: 'input' }, tokensIn);
  aiTokensTotal.inc({ endpoint, model, type: 'output' }, tokensOut);
  aiCallDurationSeconds.observe({ endpoint, model }, duration);
}

export function recordCaseCreated(caseType: string) {
  casesTotal.inc({ case_type: caseType, status: 'created' });
  casesActive.inc({ case_type: caseType });
}

export function recordCaseStatusChange(caseType: string, fromStatus: string, toStatus: string) {
  casesTotal.inc({ case_type: caseType, status: toStatus });
  if (['CLOSED', 'DELIVERED', 'REJECTED', 'CANCELLED'].includes(toStatus)) {
    casesActive.dec({ case_type: caseType });
  }
}

export function recordWorkflowTransition(workflow: string, fromState: string, toState: string) {
  workflowTransitionsTotal.inc({ workflow, from_state: fromState, to_state: toState });
}

export function recordDisbursement(type: string, success: boolean) {
  disbursementsTotal.inc({ type, status: success ? 'success' : 'failure' });
}

export function recordTimesheet(status: string) {
  timesheetsTotal.inc({ status });
}

export function recordError(component: string, errorType: string) {
  errorsTotal.inc({ component, error_type: errorType });
}

export function setDbPoolConnections(active: number, idle: number) {
  dbPoolConnections.set({ state: 'active' }, active);
  dbPoolConnections.set({ state: 'idle' }, idle);
}

// Metrics endpoint handler
export async function metricsHandler(req: any, res: any) {
  try {
    res.set('Content-Type', registry.contentType);
    res.send(await registry.metrics());
  } catch (error) {
    res.status(500).send('Error generating metrics');
  }
}

// Express middleware for metrics
export function metricsMiddleware() {
  return (req: any, res: any, next: any) => {
    const startTime = Date.now();

    res.on('finish', () => {
      const duration = (Date.now() - startTime) / 1000;
      recordHttpRequest(req.method, req.route?.path || req.path, res.statusCode, duration);
    });

    next();
  };
}