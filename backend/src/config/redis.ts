import IORedis from 'ioredis';
import { env, isRedisEnabled } from './env';
import { logger } from './logger';

export const redis = isRedisEnabled
  ? new IORedis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      retryStrategy: (times) => Math.min(times * 50, 2000),
    })
  : null;

if (redis) {
  redis.on('connect', () => logger.info('Redis connected'));
  redis.on('error', (err) => logger.error('Redis error', { err }));
} else {
  logger.info('Redis disabled — running without background job queue');
}

export default redis;
