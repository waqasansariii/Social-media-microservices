require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
const logger = require('./utils/logger');
const helmet = require('helmet');
const cors = require('cors');
const {RateLimiterRedis} = require('rate-limiter-flexible');
const Redis = require('ioredis');
const rateLimit = require('express-rate-limit')
const {RedisStore} = require('rate-limit-redis')
const routes = require('./routes/identity-service');
const { error } = require('winston');
const errorHandler = require('./middleware/errorHandler');


const app = express();



// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => logger.info('Connected to MongoDB'))
  .catch(err => logger.error("Mongo connection error", err));
// mongoose.connect("mongodb+srv://wwwmwaqascom8_db_user:zwduX7NZl2gKgAim@cluster0.qfwqvoz.mongodb.net/").then(()=>logger.info('Connected to MongoDB')).catch(err=>logger.error("Mongo cnnection error",err));
const RedisClient = new Redis(process.env.REDIS_URL);
// middleware
app.use(express.json());
app.use(helmet());
app.use(cors());

app.use((req,res,next)=>{
    logger.info(`Received ${req.method} request for ${req.url}`);
    logger.info(`Received, ${req.body}`);
    next();
});

// DDOS Protection and rate limiting 
const rateLimiter = new RateLimiterRedis({
    storeClient:RedisClient,
    keyPrefix:'middleware',
    points:100, // 100 requests
    duration:1 
});

app.use((req,res,next)=>{
    rateLimiter.consume(req.ip).then(()=>{
        next();
    }).catch(()=>{
        res.status(429).json({success:false, message:'Too many requests'});
    });  
});

// IP based rate limiting for sensitive endpoints
const sensitiveEndpointsLimiter =rateLimit({
    windowMs:15*60*1000, // 15 minutes
    max:20, // limit each IP to 20 requests per windowMs
    standardHeaders:true,
    legacyHeaders:false,
    handler:(req,res)=>{
        logger.warn(`Sensitive endpoint rate limit exceeded for IP: ${req.ip}`);
    },
    store: new RedisStore({
        sendCommand: (...args) => RedisClient.call(...args),
    }),
});
// apply this sensitiveEndpointsLimiter to sensitive endpoints like /login, /register
app.use('/api/auth/register', sensitiveEndpointsLimiter);


// Routes
app.use('/api/auth',routes);

// error handler
app.use(errorHandler);
PORT = process.env.PORT || 3000
app.listen(PORT,()=>{
    logger.info(`Identity Service running on port ${process.env.PORT}`);

})

// unhandled promise rejection
process.on('unhandledRejection',(reason,promise)=>{
    logger.error('Unhandled Rejection: %s',promise, "reason:",reason);
})