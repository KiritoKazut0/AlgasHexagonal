
import Redis from 'ioredis';

// Configuración de Redis usando variables de entorno
const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost', // Dirección de tu servidor Redis
  port: parseInt(process.env.REDIS_PORT || '6379'), // Puerto Redis
  password: process.env.REDIS_PASSWORD || '', // Si tienes contraseña de Redis, inclúyela
  db: 0, // Base de datos de Redis (por defecto es 0)
  retryStrategy: (times) => {
    // Intentos de reconexión automáticos
    return Math.min(times * 50, 2000); // Reintentar cada 50ms, hasta 2 segundos
  },
});

redisClient.on('connect', () => {
  console.log('✅ Conexión a Redis exitosa');
});

redisClient.on('error', (err) => {
  console.error(`❌ Error en la conexión de Redis: ${err.message}`);
});

export default redisClient;
