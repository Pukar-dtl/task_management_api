const { client: redisClient } = require('../config/redis');

const rateLimiter = async (req, res, next) => {
    try {
        const identifier = req.ip || (req.session && req.session.userId) || 'anonymous';
        const key = `rate_limit:${identifier}`;
        const maxRequests = process.env.RATE_LIMIT_MAX || 20;
        const windowMs = process.env.RATE_LIMIT_WINDOW || 60000;
        
        const currentCount = await redisClient.get(key);
        
        if (currentCount && parseInt(currentCount) >= maxRequests) {
            return res.status(429).json({ 
                error: 'Too many requests. Please try again later.' 
            });
        }
        
        if (currentCount) {
            await redisClient.incr(key);
        } else {
            await redisClient.setEx(key, Math.floor(windowMs / 1000), '1');
        }
        
        next();
    } catch (error) {
        console.error('Rate limiter error:', error);
        next();
    }
};

module.exports = rateLimiter;