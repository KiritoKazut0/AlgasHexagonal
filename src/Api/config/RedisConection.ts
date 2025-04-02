import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay; 
  }
});


redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});

const CACHE_TTL = 600; 

export {
  redis,
  CACHE_TTL
};
