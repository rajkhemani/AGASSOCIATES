import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { Router } from './router';
import { Telegraf } from 'telegraf';
import { CoordinatorAgent, SpecialistAgentPool, ResultAggregator } from './hierarchy';

const app = new Hono();

app.use('*', logger());
app.use('*', cors());

app.get('/', (c) => c.json({ status: 'ok', service: 'coordinator' }));
app.get('/health', (c) => c.json({ status: 'healthy' }));

app.post('/agent', async (c) => {
  const { query, userId, context } = await c.req.json();
  
  const pool = new SpecialistAgentPool(3);
  const aggregator = new ResultAggregator();
  
  const results = pool.execute(query, context || {});
  const aggregated = aggregator.aggregate(results);
  
  return c.json({
    response: aggregated.finalResponse,
    confidence: aggregated.confidence,
    specialists: results.length
  });
});

app.post('/telegram/webhook', async (c) => {
  const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN || '');
  
  bot.on('text', async (ctx) => {
    const text = ctx.message.text;
    
    if (text.startsWith('/agent')) {
      const query = text.replace('/agent', '').trim();
      const pool = new SpecialistAgentPool(3);
      const aggregator = new ResultAggregator();
      const results = pool.execute(query, {});
      const aggregated = aggregator.aggregate(results);
      
      await ctx.reply(aggregated.finalResponse);
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