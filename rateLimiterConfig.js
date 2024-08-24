const Redis = require('redis');
const { RateLimiterRedis } = require('rate-limiter-flexible');

// Initialize Redis client
const redisClient = Redis.createClient({
    host: '127.0.0.1', // or your Redis server address
    port: 6379,         // default Redis port
    enable_offline_queue: false, // Optional: Disable offline queueing
});

// Handle Redis connection errors
redisClient.on('error', (err) => {
    console.error('Redis error:', err);
});

// Ensure Redis client is connected
redisClient.on('connect', () => {
    console.log('Connected to Redis');
});

// Rate limiter configuration
const rateLimiter = new RateLimiterRedis({
    storeClient: redisClient,  // Pass the Redis client here
    keyPrefix: 'user_task_rate_limit',
    points: 20, // 20 tasks per minute
    duration: 60, // Per minute
    blockDuration: 1, // Block for 1 second after consuming all points
});

module.exports = { redisClient, rateLimiter };
