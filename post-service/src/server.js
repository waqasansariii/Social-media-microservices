require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const Redis = require('ioredis');
const cors = require('cors');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const postRoutes = require('./routes/post-routes');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3002;

// ✅ Connect MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => logger.info("Connected to MongoDB"))
  .catch(err => logger.error("MongoDB connection error:", err));

// ✅ Redis connection
const redisClient = new Redis(process.env.REDIS_URL);

// ✅ Middlewares
app.use(express.json());
app.use(helmet());
app.use(cors());

app.use((req, res, next) => {
  logger.info(`Received ${req.method} request for ${req.url}`);
  logger.info(`Request body: ${JSON.stringify(req.body)}`);
  next();
});

// ✅ IP-based rate limiter
const sensitiveEndpointsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Sensitive endpoint rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({ message: 'Too many requests, try again later.' });
  },
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
});

// ✅ Routes
app.use('/api/posts', sensitiveEndpointsLimiter, (req, res, next) => {
  req.redisClient = redisClient;
  next();
}, postRoutes);

// Media upload route
const httpProxy = require('http-proxy');
const { connectRabbitMQ } = require('./utils/rabbitmq');
const proxy = httpProxy.createProxyServer({});

app.post('/api/media/upload', (req, res) => {
    proxy.web(req, res, {
        target: 'http://localhost:3001',
        changeOrigin: true
    });
});

// ✅ Global error handler
app.use(errorHandler);

async function startServer(){
  try{
     await connectRabbitMQ();
     app.listen(PORT, () => {
  logger.info(`Post Service is running on port ${PORT}`);
     })
  }catch(e){
    logger.error("Error starting server:", e);
    process.exit(1);

  }
};

// ✅ Start server
startServer();

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", promise, "reason:", reason);
});
