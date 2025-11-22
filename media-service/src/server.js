require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const mediaRoutes = require('./routes/media-routes');
const logger = require('./utils/logger');
const helmet = require('helmet');
const cors = require('cors');
const errorhandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3003;

mongoose.connect(process.env.MONGO_URI)
.then(() => logger.info("Connected to MongoDB successfully"))
.catch(err => logger.error("MongoDB connection error:", err));

app.use(helmet());
app.use(cors());

// ❌ Do NOT run JSON parser on multipart requests
app.use((req, res, next) => {
    if (req.path === "/api/media/upload") {
        return next(); // skip express.json()
    }
    express.json()(req, res, next);
});

app.use((req, res, next) => {
    logger.info(`Received ${req.method} request for ${req.url}`);
    next();
});

app.use('/api/media', mediaRoutes);
app.use(errorhandler);

async function startServer(){
    try{
        await connectRabbitMQ();
        // consume all the events
        await consumeEvent('post.deleted',handlePostDeleted); 
        app.listen(PORT, () => {
     logger.info(`Media Service is running on port ${PORT}`);
        })
    }
    catch(e){
        logger.error("Error starting server:", e);
        process.exit(1);
    }
}

startServer();

process.on("unhandledRejection", (reason, promise) => {
    logger.error("Unhandled Rejection at:", promise, "reason:", reason);
});

