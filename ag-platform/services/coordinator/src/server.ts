import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { createRouter } from './router';
import { Telegraf } from 'telegraf';
import { HierarchicalCoordinator } from './hierarchy';

const app = new Hono();

app.use('*', logger());
app.use('*', cors());

app.get('/', (c) => c.json({ status: 'ok', service: 'coordinator' }));
app.get('/health', (c) => c.json({ status: 'healthy' }));

app.post('/agent', async (c) => {
  const { query } = await c.req.json();
  const coordinator = new HierarchicalCoordinator(process.env.GEMINI_API_KEY || '');
  const result = await coordinator.execute(query);
  
  return c.json({
    response: result.finalAnswer,
    report: result.report,
    specialists: result.results.length
  });
});

app.post('/telegram/webhook', async (c) => {
  const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN || '');
  
  bot.on('text', async (ctx) => {
    const text = (ctx.message as any).text;
    
    if (text.startsWith('/agent')) {
      const query = text.replace('/agent', '').trim();
      const coordinator = new HierarchicalCoordinator(process.env.GEMINI_API_KEY || '');
      const result = await coordinator.execute(query);
      await ctx.reply(result.finalAnswer);
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
