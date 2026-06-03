import Telegraf from 'telegraf';
import { Markup } from 'telegraf';
import { HierarchicalCoordinator } from './hierarchy.js';
import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

// ─── Configuration ─────────────────────────────────────────────────────────
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'ag_coordinator',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
};

if (!BOT_TOKEN || !GEMINI_API_KEY) {
  console.error('Missing required environment variables:');
  if (!BOT_TOKEN) console.error('- TELEGRAM_BOT_TOKEN');
  if (!GEMINI_API_KEY) console.error('- GEMINI_API_KEY');
  process.exit(1);
}

// ─── Initialize Services ───────────────────────────────────────────────────
const bot = new Telegraf(BOT_TOKEN);
const coordinator = new HierarchicalCoordinator(GEMINI_API_KEY);
const dbPool = new Pool(DB_CONFIG);

// ─── Database Setup ────────────────────────────────────────────────────────
async function initDatabase() {
  const client = await dbPool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS agent_executions (
        id SERIAL PRIMARY KEY,
        request TEXT NOT NULL,
        plan JSONB,
        results JSONB,
        final_answer TEXT,
        report TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS agent_tasks (
        id SERIAL PRIMARY KEY,
        execution_id INTEGER REFERENCES agent_executions(id),
        task_id VARCHAR(50),
        role VARCHAR(20),
        status VARCHAR(20),
        output TEXT,
        error TEXT,
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        duration INTEGER
      );

      CREATE INDEX IF NOT EXISTS idx_agent_executions_created ON agent_executions(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_agent_tasks_execution ON agent_tasks(execution_id);
    `);
  } finally {
    client.release();
  }
}

// ─── Helper Functions ─────────────────────────────────────────────────────
function formatHierarchyStatus(results: any[]): string {
  if (!results.length) return 'No tasks executed';

  const statusMap = {
    completed: '✅',
    running: '🟡',
    pending: '⚪',
    failed: '❌'
  };

  let hierarchy = '```\n';
  hierarchy += 'HIERARCHICAL EXECUTION STATUS\n';
  hierarchy += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';

  // Group by role for cleaner display
  const byRole: Record<string, any[]> = {};
  results.forEach(r => {
    if (!byRole[r.role]) byRole[r.role] = [];
    byRole[r.role].push(r);
  });

  const roleOrder = ['coordinator', 'research', 'code', 'writer', 'reviewer'];
  roleOrder.forEach(role => {
    if (byRole[role]) {
      hierarchy += `${role.toUpperCase()}:\n`;
      byRole[role].forEach(task => {
        const status = statusMap[task.status as keyof typeof statusMap] || '❓';
        hierarchy += `  ${status} ${task.taskId}: ${task.description.substring(0, 30)}...\n`;
      });
      hierarchy += '\n';
    }
  });

  hierarchy += '```';
  return hierarchy;
}

function formatExecutionTime(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

// ─── Command Handlers ─────────────────────────────────────────────────────
bot.start(async (ctx) => {
  await ctx.reply(
    `🤖 <b>Hierarchical Multi-Agent AI System</b>\n\n` +
    `Welcome! I coordinate a team of specialized AI agents to handle complex tasks.\n\n` +
    `<b>How it works:</b>\n` +
    `1. You give a natural language request\n` +
    `2. I (Coordinator) break it into sub-tasks\n` +
    `3. Specialist agents (Research, Code, Writer) work in parallel\n` +
    `4. I synthesize the results into a final answer\n\n` +
    `<b>Commands:</b>\n` +
    `/agent &lt;request&gt; - Execute a task\n` +
    `/status - View recent executions\n` +
    `/help - Show this help`,
    { parse_mode: 'HTML' }
  );
});

bot.command('agent', async (ctx) => {
  const commandText = ctx.message?.text?.replace('/agent', '').trim();

  if (!commandText) {
    return ctx.reply('Usage: /agent &lt;your request&gt;\nExample: /agent Research current home loan rates in India and draft an email to a client');
  }

  // Send initial status
  const statusMsg = await ctx.reply(
    `🚀 <b>Mission Initiated</b>\n\n` +
    `📝 Request: <i>${commandText.substring(0, 100)}...</i>\n` +
    `⏳ Phase 1: Coordinator analyzing...`,
    { parse_mode: 'HTML' }
  );

  try {
    // Execute through hierarchy
    const { finalAnswer, report, results } = await coordinator.execute(commandText);

    // Store execution in database
    const client = await dbPool.connect();
    try {
      const executionResult = await client.query(
        `INSERT INTO agent_executions (request, plan, results, final_answer, report, completed_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [
          commandText,
          JSON.stringify({ /* plan would be stored here */ }),
          JSON.stringify(results),
          finalAnswer,
          report,
          new Date()
        ]
      );

      const executionId = executionResult.rows[0].id;

      // Store individual task results
      for (const result of results) {
        await client.query(
          `INSERT INTO agent_tasks
           (execution_id, task_id, role, status, output, error, started_at, completed_at, duration)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            executionId,
            result.taskId,
            result.role,
            result.status,
            result.output || null,
            result.error || null,
            result.startedAt ? new Date(result.startedAt) : null,
            result.completedAt ? new Date(result.completedAt) : null,
            result.duration || null
          ]
        );
      }
    } finally {
      client.release();
    }

    // Format response with hierarchy visualization
    const executionTime = Date.now() - parseInt((ctx.message?.date || 0) * 1000 + '');

    let response = `✅ <b>Mission Complete</b>\n\n`;
    response += `⏱️ Execution time: ${formatExecutionTime(executionTime)}\n\n`;
    response += `📊 <b>Hierarchy Status:</b>\n`;
    response += formatHierarchyStatus(results) + '\n\n';
    response += `📋 <b>Final Answer:</b>\n`;
    response += finalAnswer;

    // Split message if too long (Telegram limit: 4096 chars)
    if (response.length > 4000) {
      await ctx.telegram.editMessageText(
        ctx.chat!.id,
        statusMsg.message_id,
        undefined,
        `✅ <b>Mission Complete</b>\n\n⏱️ Execution time: ${formatExecutionTime(executionTime)}\n\n📋 <b>Final Answer:</b>\n${finalAnswer.substring(0, 3500)}...`,
        { parse_mode: 'HTML' }
      );

      await ctx.reply(
        `📊 <b>Execution Report:</b>\n${report}`,
        { parse_mode: 'HTML' }
      );
    } else {
      await ctx.telegram.editMessageText(
        ctx.chat!.id,
        statusMsg.message_id,
        undefined,
        response,
        { parse_mode: 'HTML' }
      );
    }
  } catch (error) {
    console.error('Execution failed:', error);
    await ctx.telegram.editMessageText(
      ctx.chat!.id,
      statusMsg.message_id,
      undefined,
      `❌ <b>Mission Failed</b>\n\n` +
      `The hierarchical coordinator encountered an error:\n` +
      `<pre>${error.message}</pre>`,
      { parse_mode: 'HTML' }
    );
  }
});

bot.command('status', async (ctx) => {
  try {
    const client = await dbPool.connect();
    try {
      const result = await client.query(
        `SELECT id, request, created_at, completed_at
         FROM agent_executions
         ORDER BY created_at DESC
         LIMIT 5`
      );

      if (result.rows.length === 0) {
        return ctx.reply('📊 No executions recorded yet.');
      }

      let message = '📊 <b>Recent Executions</b>\n\n';
      result.rows.forEach((row: any, index: number) => {
        const duration = row.completed_at
          ? `${formatExecutionTime((row.completed_at.getTime() - row.created_at.getTime()))}`
          : 'Running...';

        message += `${index + 1}. <b>#${row.id}</b>\n`;
        message += `   📝 ${row.request.substring(0, 50)}...\n`;
        message += `   🕐 ${row.created_at.toLocaleString()}\n`;
        message += `   ⏱️ ${duration}\n\n`;
      });

      await ctx.reply(message, { parse_mode: 'HTML' });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Status query failed:', error);
    await ctx.reply('❌ Failed to fetch status from database.');
  }
});

bot.command('help', (ctx) => {
  ctx.reply(
    `🤖 <b>Hierarchical Multi-Agent AI System</b>\n\n` +
    `<b>Architecture:</b>\n` +
    `┌─────────────────────────────┐\n` +
    `│     COORDINATOR AGENT       │  ← Top-level orchestrator\n` +
    `└─────────────┬───────────────┘\n` +
    `              ▼\n` +
    `┌─────────────┴───────────────┐\n` +
    `│ SPECIALIST AGENTS (Parallel)│  ← Research, Code, Writer\n` +
    `└─────────────┬───────────────┘\n` +
    `              ▼\n` +
    `┌─────────────────────────────┐\n` +
    `│   RESULT AGGREGATOR         │  ← Synthesis & formatting\n` +
    `└─────────────────────────────┘\n\n` +
    `<b>Usage:</b>\n` +
    `/agent &lt;request&gt; - Execute complex task\n` +
    `/status - View recent executions\n` +
    `/help - Show this help\n\n` +
    `<b>Example requests:</b>\n` +
    `• "Research current RBI home loan policies and create a summary for clients"\n` +
    `• "Analyze the pros and cons of fixed vs floating rate mortgages"\n` +
    `• "Generate a Python script to calculate EMI with prepayment options"\n` +
    `• "Review this loan agreement for potential issues and suggest improvements"`,
    { parse_mode: 'HTML' }
  );
});

// ─── Error Handling ───────────────────────────────────────────────────────
bot.catch((err, ctx) => {
  console.error(`Telegram error for ${ctx.updateType}:`, err);
  ctx.reply('❌ An internal error occurred. Please try again.');
});

// ─── Start Bot ───────────────────────────────────────────────────────────
async function startBot() {
  await initDatabase();
  await bot.launch();

  console.log('🤖 Hierarchical Coordinator Bot is running...');
  console.log('📡 Listening for commands in Telegram');

  // Enable graceful shutdown
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

startBot().catch(console.error);
