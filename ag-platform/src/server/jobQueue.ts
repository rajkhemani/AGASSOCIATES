import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import Redis from 'ioredis';
import { CronJob } from 'cron';
import { logger } from './logger.ts';
import { pool } from './db.ts';
import { generateInvoiceFromTimesheets, autoMarkOverdueInvoices } from '../lib/billing.ts';

// Redis connection
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const redisPassword = process.env.REDIS_PASSWORD || '';

export const redis = new Redis(redisUrl, {
  password: redisPassword || undefined,
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 50, 2000),
  lazyConnect: true,
});

redis.on('error', (err) => {
  logger.error({ err }, 'Redis connection error');
});

redis.on('connect', () => {
  logger.info('Redis connected for job queue');
});

// Queue names
export const QUEUES = {
  INVOICE_GENERATION: 'invoice_generation',
  OVERDUE_CHECK: 'overdue_check',
  DISBURSEMENT_RECONCILIATION: 'disbursement_reconciliation',
  BANK_ADVANCE_SYNC: 'bank_advance_sync',
  EMAIL_NOTIFICATION: 'email_notification',
  DOCUMENT_PROCESSING: 'document_processing',
  AI_PROCESSING: 'ai_processing',
  RPA_TASK: 'rpa_task',
  WEBHOOK_DELIVERY: 'webhook_delivery',
  REPORT_GENERATION: 'report_generation',
} as const;

// Default job options
const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential' as const,
    delay: 2000,
  },
  removeOnComplete: 100,
  removeOnFail: 50,
};

// Create queues
export const queues: Record<string, Queue> = {};

export function createQueue(name: string): Queue {
  if (!queues[name]) {
    queues[name] = new Queue(name, {
      connection: redis,
      defaultJobOptions,
    });

    // Queue events for monitoring
    const queueEvents = new QueueEvents(name, { connection: redis });
    queueEvents.on('completed', ({ jobId, returnvalue }) => {
      logger.debug({ queue: name, jobId }, 'Job completed');
    });
    queueEvents.on('failed', ({ jobId, failedReason }) => {
      logger.error({ queue: name, jobId, failedReason }, 'Job failed');
    });
    queueEvents.on('stalled', ({ jobId }) => {
      logger.warn({ queue: name, jobId }, 'Job stalled');
    });
  }
  return queues[name];
}

// Initialize all queues
Object.values(QUEUES).forEach(createQueue);

// Job types
export interface InvoiceGenerationJob {
  orgId: string;
  caseIds: string[];
  bankId?: string;
  taxRate?: number;
  paymentTermsDays?: number;
  generatedBy: string;
}

export interface OverdueCheckJob {
  orgId?: string; // If not provided, checks all orgs
}

export interface DisbursementReconciliationJob {
  orgId: string;
  triggeredBy: string;
}

export interface BankAdvanceSyncJob {
  bankId: string;
}

// Local record_activity for job queue
async function recordActivity(
  data: {
    source: string;
    staff_kind: string;
    staff_short_name: string;
    capability_code: string;
    case_id?: string;
    org_id?: string;
    summary: string;
    payload?: Record<string, any>;
    status: 'ok' | 'error' | 'warn';
  }
): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO staff_activity
       (source, staff_short_name, staff_kind, capability_code, case_id, org_id, summary, payload, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        data.source,
        data.staff_short_name,
        data.staff_kind,
        data.capability_code,
        data.case_id || null,
        data.org_id || null,
        data.summary,
        JSON.stringify(data.payload || {}),
        data.status,
      ]
    );
  } catch (error) {
    logger.warn({ err: error }, 'Activity insert failed');
  }
}

// Worker handlers
async function handleInvoiceGeneration(job: Job<InvoiceGenerationJob>): Promise<any> {
  const { orgId, caseIds, bankId, taxRate, paymentTermsDays, generatedBy } = job.data;

  logger.info({ orgId, caseIds, jobId: job.id }, 'Starting invoice generation');

  try {
    const invoice = await generateInvoiceFromTimesheets(
      orgId,
      caseIds,
      bankId,
      taxRate,
      paymentTermsDays
    );

    await recordActivity({
      source: 'job_queue',
      staff_kind: 'system',
      staff_short_name: 'invoice_worker',
      capability_code: 'invoice.generate',
      case_id: caseIds[0],
      org_id: orgId,
      summary: `Invoice ${invoice.invoice_number} generated for ${caseIds.length} cases`,
      payload: { invoice_id: invoice.id, case_ids: caseIds, generated_by: generatedBy },
      status: 'ok',
    });

    return { success: true, invoice };
  } catch (error: any) {
    await recordActivity({
      source: 'job_queue',
      staff_kind: 'system',
      staff_short_name: 'invoice_worker',
      capability_code: 'invoice.generate',
      case_id: caseIds[0],
      org_id: orgId,
      summary: `Invoice generation failed: ${error.message}`,
      status: 'error',
    });
    throw error;
  }
}

async function handleOverdueCheck(job: Job<OverdueCheckJob>): Promise<any> {
  logger.info({ jobId: job.id }, 'Starting overdue invoice check');

  try {
    const count = await autoMarkOverdueInvoices();

    await recordActivity({
      source: 'job_queue',
      staff_kind: 'system',
      staff_short_name: 'overdue_worker',
      capability_code: 'invoice.overdue_check',
      org_id: job.data.orgId,
      summary: `Overdue check completed - ${count} invoices marked overdue`,
      status: 'ok',
    });

    return { success: true, marked_overdue: count };
  } catch (error: any) {
    logger.error({ err: error, jobId: job.id }, 'Overdue check failed');
    throw error;
  }
}

async function handleDisbursementReconciliation(job: Job<DisbursementReconciliationJob>): Promise<any> {
  const { orgId, triggeredBy } = job.data;

  logger.info({ orgId, jobId: job.id }, 'Starting disbursement reconciliation');

  try {
    const client = await pool.connect();
    try {
      // Get unreimbursed disbursements
      const result = await client.query(
        `SELECT d.*, c.case_number, c.bank_id
         FROM disbursements d
         JOIN cases c ON c.id = d.case_id
         WHERE c.org_id = $1 AND d.is_reimbursed = false
         ORDER BY d.paid_date ASC`,
        [orgId]
      );

      let reconciled = 0;
      for (const disbursement of result.rows) {
        // Check if bank has advance balance to cover
        const bankResult = await client.query(
          `SELECT advance_balance FROM banks WHERE id = $1`,
          [disbursement.bank_id]
        );

        if (bankResult.rows.length > 0) {
          const advanceBalance = bankResult.rows[0].advance_balance;
          const amount = parseFloat(disbursement.amount);

          if (advanceBalance >= amount) {
            // Use bank advance to reimburse
            await client.query(
              `UPDATE banks SET advance_balance = advance_balance - $1, total_recovered = total_recovered + $1 WHERE id = $2`,
              [amount, disbursement.bank_id]
            );

            await client.query(
              `UPDATE disbursements SET is_reimbursed = true, reimbursed_at = NOW(), bank_advance_used = $1, reconciliation_notes = 'Auto-reimbursed from bank advance' WHERE id = $2`,
              [amount, disbursement.id]
            );

            reconciled++;
          }
        }
      }

      await recordActivity({
        source: 'job_queue',
        staff_kind: 'system',
        staff_short_name: 'reconciliation_worker',
        capability_code: 'disbursement.reconcile',
        org_id: orgId,
        summary: `Disbursement reconciliation completed - ${reconciled} disbursements reconciled`,
        payload: { org_id: orgId, reconciled_count: reconciled },
        status: 'ok',
      });

      return { success: true, reconciled };
    } finally {
      client.release();
    }
  } catch (error: any) {
    logger.error({ err: error, jobId: job.id }, 'Disbursement reconciliation failed');
    throw error;
  }
}

async function handleBankAdvanceSync(job: Job<BankAdvanceSyncJob>): Promise<any> {
  const { bankId } = job.data;

  logger.info({ bankId, jobId: job.id }, 'Syncing bank advance status');

  try {
    const result = await pool.query(
      `SELECT id, name, short_code, advance_balance, total_recovered
       FROM banks WHERE id = $1`,
      [bankId]
    );

    if (result.rows.length === 0) {
      throw new Error(`Bank not found: ${bankId}`);
    }

    const bank = result.rows[0];

    await recordActivity({
      source: 'job_queue',
      staff_kind: 'system',
      staff_short_name: 'bank_sync_worker',
      capability_code: 'bank.advance_sync',
      org_id: undefined,
      summary: `Bank advance sync - ${bank.name}: ₹${bank.advance_balance} remaining`,
      payload: { bank_id: bankId, advance_balance: bank.advance_balance },
      status: 'ok',
    });

    return { success: true, bank };
  } catch (error: any) {
    logger.error({ err: error, jobId: job.id }, 'Bank advance sync failed');
    throw error;
  }
}

// Create workers
export const workers: Record<string, Worker> = {};

export function createWorker(name: string, handler: (job: Job) => Promise<any>): Worker {
  if (!workers[name]) {
    workers[name] = new Worker(name, handler, {
      connection: redis,
      concurrency: 5,
      limiter: {
        max: 10,
        duration: 1000,
      },
    });

    workers[name].on('completed', (job) => {
      logger.debug({ queue: name, jobId: job.id }, 'Worker job completed');
    });

    workers[name].on('failed', (job, err) => {
      logger.error({ queue: name, jobId: job?.id, error: err?.message }, 'Worker job failed');
    });

    workers[name].on('error', (err) => {
      logger.error({ queue: name, error: err?.message }, 'Worker error');
    });
  }
  return workers[name];
}

// Initialize workers
createWorker(QUEUES.INVOICE_GENERATION, handleInvoiceGeneration);
createWorker(QUEUES.OVERDUE_CHECK, handleOverdueCheck);
createWorker(QUEUES.DISBURSEMENT_RECONCILIATION, handleDisbursementReconciliation);
createWorker(QUEUES.BANK_ADVANCE_SYNC, handleBankAdvanceSync);

// Job scheduling helpers
export async function scheduleInvoiceGeneration(data: InvoiceGenerationJob, delayMs = 0): Promise<Job> {
  const queue = queues[QUEUES.INVOICE_GENERATION];
  return queue.add('generate', data, { delay: delayMs });
}

export async function scheduleOverdueCheck(data: OverdueCheckJob = {}, delayMs = 0): Promise<Job> {
  const queue = queues[QUEUES.OVERDUE_CHECK];
  return queue.add('check', data, { delay: delayMs });
}

export async function scheduleDisbursementReconciliation(data: DisbursementReconciliationJob, delayMs = 0): Promise<Job> {
  const queue = queues[QUEUES.DISBURSEMENT_RECONCILIATION];
  return queue.add('reconcile', data, { delay: delayMs });
}

export async function scheduleBankAdvanceSync(data: BankAdvanceSyncJob, delayMs = 0): Promise<Job> {
  const queue = queues[QUEUES.BANK_ADVANCE_SYNC];
  return queue.add('sync', data, { delay: delayMs });
}

// Cron job scheduling
export function startCronJobs() {
  // Daily overdue check at 9 AM
  new CronJob('0 9 * * *', async () => {
    await scheduleOverdueCheck({});
  }, null, true, 'Asia/Kolkata');

  // Hourly disbursement reconciliation during business hours (10 AM - 6 PM)
  new CronJob('0 10-18 * * 1-5', async () => {
    const orgsResult = await pool.query('SELECT id FROM organizations');
    for (const org of orgsResult.rows) {
      await scheduleDisbursementReconciliation({ orgId: org.id, triggeredBy: 'cron' });
    }
  }, null, true, 'Asia/Kolkata');

  // Bank advance sync every 30 minutes
  new CronJob('*/30 * * * *', async () => {
    const banksResult = await pool.query('SELECT id FROM banks WHERE advance_balance > 0');
    for (const bank of banksResult.rows) {
      await scheduleBankAdvanceSync({ bankId: bank.id });
    }
  }, null, true, 'Asia/Kolkata');

  logger.info('Cron jobs started');
}

// Graceful shutdown
export async function shutdownJobQueue() {
  logger.info('Shutting down job queue...');

  // Close all workers
  for (const worker of Object.values(workers)) {
    await worker.close();
  }

  // Close all queues
  for (const queue of Object.values(queues)) {
    await queue.close();
  }

  // Close Redis connection
  await redis.quit();

  logger.info('Job queue shut down complete');
}

// Queue metrics
export async function getQueueMetrics() {
  const metrics: Record<string, any> = {};

  for (const [name, queue] of Object.entries(queues)) {
    const waiting = await queue.getWaitingCount();
    const active = await queue.getActiveCount();
    const completed = await queue.getCompletedCount();
    const failed = await queue.getFailedCount();
    const delayed = await queue.getDelayedCount();

    metrics[name] = { waiting, active, completed, failed, delayed };
  }

  return metrics;
}

export { redis as jobQueueRedis };