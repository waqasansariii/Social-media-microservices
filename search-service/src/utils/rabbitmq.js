const amqp = require('amqplib');
const logger = require('./logger');


let connection = null;
let channel = null;

const EXCHANGE_NAME = 'facebook_events';

async function connectRabbitMQ() {
    try {
        connection = await amqp.connect(process.env.RABBITMQ_URL);
        channel = await connection.createChannel();

        await channel.assertExchange(EXCHANGE_NAME,'topic',{durable:true});
        logger.info('Connected to RabbitMQ successfully');
        return channel;
    }
    catch(e){
        logger.error('RabbitMQ Connection Error:', e);

    }


};

module.exports = {connectRabbitMQ}