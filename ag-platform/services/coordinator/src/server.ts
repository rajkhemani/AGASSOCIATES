import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { Telegraf } from 'telegraf';
import { HierarchicalCoordinator } from './hierarchy';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!TELEGRAM_BOT_TOKEN) {
  console.error('TELEGRAM_BOT_TOKEN is required but not set. Exiting.');
  process.exit(1);
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY is required but not set. Exiting.');
  process.exit(1);
}

const app = new Hono();

app.use('*', logger());
app.use('*', cors());

app.get('/', (c) => c.json({ status: 'ok', service: 'coordinator' }));
app.get('/health', (c) => c.json({ status: 'healthy' }));

app.post('/agent', async (c) => {
  const { query } = await c.req.json();

  const coordinator = new HierarchicalCoordinator(GEMINI_API_KEY);
  const { finalAnswer, results } = await coordinator.execute(query);

  return c.json({
    response: finalAnswer,
    specialists: results.length,
  });
});

app.post('/telegram/webhook', async (c) => {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secret) {
    const header = c.req.header('x-telegram-bot-api-secret-token');
    if (!header || header !== secret) {
      console.warn('coordinator: invalid telegram webhook secret');
      return c.json({ error: 'invalid secret token' }, 401);
    }
  }
  const bot = new Telegraf(TELEGRAM_BOT_TOKEN);

  bot.on('text', async (ctx) => {
    const text = ctx.message.text;

    if (text.startsWith('/agent')) {
      const query = text.replace('/agent', '').trim();
      const coordinator = new HierarchicalCoordinator(GEMINI_API_KEY);
      const { finalAnswer } = await coordinator.execute(query);

      await ctx.reply(finalAnswer);
    } else if (text.startsWith('/status')) {
      await ctx.reply('Coordinator service is running. Use /agent <query> to process.');
    } else if (text.startsWith('/help')) {
      await ctx.reply('Commands:\n/agent <query> - Process with multi-agent coordinator\n/status - Check service status\n/help - Show this help');
    } else {
      await ctx.reply('Unknown command. Use /help for available commands.');
    }
  });

  return c.json({ ok: true });
});

const port = parseInt(process.env.COORDINATOR_PORT || '3002');

console.log(`Starting coordinator service on port ${port}`);

serve({
  fetch: app.fetch,
  port
});
