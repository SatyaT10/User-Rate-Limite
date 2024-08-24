var express = require('express');
var router = express.Router();
const Redis = require('redis');
const { RateLimiterRedis } = require('rate-limiter-flexible');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const { redisClient, rateLimiter } = require('../rateLimiterConfig'); 

router.use(express.json());

// Configure Redis
// const redisClient = Redis.createClient();
const setAsync = promisify(redisClient.set).bind(redisClient);
const getAsync = promisify(redisClient.get).bind(redisClient);

// Rate limiter configuration


const taskQueue = new Map();

async function task(user_id) {
    const logMessage = `${user_id}-task completed at-${Date.now()}\n`;
    console.log(logMessage);

    // Log the task completion to a file
    fs.routerendFileSync(path.join(__dirname, 'task_logs.txt'), logMessage);
}

router.post('/v1/task', async (req, res) => {
    const userId = req.body.user_id;

    if (!userId) {
        return res.status(400).send({ error: 'user_id is required' });
    }

    try {
        // Check rate limit
        await rateLimiter.consume(userId, 1);

        if (!taskQueue.has(userId)) {
            taskQueue.set(userId, []);
        }

        taskQueue.get(userId).push(async () => {
            await task(userId);
        });
        processQueue(userId);

        res.status(200).send({ message: 'Task queued successfully' });
    } catch (rejRes) {
        if (rejRes instanceof Error) {
            // Not a rate limiter error
            throw rejRes;
        } else {
            res.status(429).send({ error: 'Too many requests' });
        }
    }
});

async function processQueue(userId) {
    const queue = taskQueue.get(userId);
    if (queue && queue.length > 0) {
        const taskFn = queue.shift();
        await taskFn();
        if (queue.length > 0) {
            setTimeout(() => processQueue(userId), 1000);
        }
    }
}


module.exports = router;
