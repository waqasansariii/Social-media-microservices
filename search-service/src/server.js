require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const Redis = require('ioredis');
const cors = require('cors');
const helmet = require('helmet');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');
const {connectionToRabbitMQ,consumeEvents} = require('./utils/rabbitmq');
const searchRoutes = require('./routes/search-routes');
// const handlePostCreated = require('./eventHandlers/search-event-handlers');
const { handlePostDeleted,handlePostCreated } = require('../../media-service/src/eventHandlers/media-event-handlers');

const app = express();
const PORT = process.env.PORT || 3004;  

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

app.use('/api/search', searchRoutes);

app.use(errorHandler);
async function startServer() {
    try{
        await connectionToRabbitMQ();  

        // consume the events / subscribe to the events
        await consumeEvents('post.created',handlePostCreated);
        await consumeEvents('post.deleted',handlePostDeleted);
        app.listen(PORT,()=>{
            logger.info(`Search Service is running on port ${PORT}`);
        })


    }
    catch(err){
        logger.error('Error starting server:', err);
        process.exit(1);
    }
}