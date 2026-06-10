import Fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from 'fastify-type-provider-zod';
import { connectRedis, redisClient } from './services/redis.service';
import webhookRoutes from './routes/webhook';
import dashboardRoutes from './routes/dashboard';

dotenv.config();

const isProd = process.env.NODE_ENV === 'production';

const fastify = Fastify({
  logger: isProd
    ? true
    : {
        transport: {
          target: 'pino-pretty',
        },
      },
}).withTypeProvider<ZodTypeProvider>();

// Set up Zod validation
fastify.setValidatorCompiler(validatorCompiler);
fastify.setSerializerCompiler(serializerCompiler);

async function start() {
  try {
    await fastify.register(cors);

    // Connect to Redis (non-fatal on failure — server starts regardless)
    try {
      await connectRedis();
    } catch (err) {
      fastify.log.warn({ err }, 'Redis unreachable on startup — running without Redis');
    }

    // SMS Ingest (root-level, outside /api/v1/webhook prefix) for Android SMS Forwarder
    fastify.post('/api/sms/ingest', async (request, reply) => {
      const body = request.body as Record<string, string | undefined>;
      const text = body?.text || body?.message || '';
      const from = body?.from || body?.sender || 'unknown';
      fastify.log.info({ from, preview: text.slice(0, 60) }, 'SMS ingest');
      try {
        await redisClient.rPush(
          'sms:incoming',
          JSON.stringify({ from, text, received_at: new Date().toISOString() })
        );
        return { status: 'success' };
      } catch (err) {
        fastify.log.error({ err }, 'Redis push failed — SMS not stored');
        return reply.code(503).send({ status: 'error', message: 'storage unavailable' });
      }
    });

    // Register Routes
    await fastify.register(webhookRoutes, { prefix: '/api/v1/webhook' });
    await fastify.register(dashboardRoutes, { prefix: '/api/v1/dashboard' });

    // Health Check
    fastify.get('/health', async (_req, reply) => {
      try {
        await redisClient.ping();
        return { status: 'healthy' };
      } catch (err) {
        fastify.log.error({ err }, 'Health check failed');
        return reply.code(503).send({ status: 'unhealthy', error: 'redis unreachable' });
      }
    });

    const parsedPort = Number(process.env.PORT);
    const PORT = Number.isInteger(parsedPort) && parsedPort > 0 ? parsedPort : 3000;
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
