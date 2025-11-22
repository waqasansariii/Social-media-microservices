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
async function publishEvent(routingKey, message) {
    if(!channel){
        await connectRabbitMQ();
    }
    channel.publish(EXCHANGE_NAME,routingKey,Buffer.from(JSON.stringify(message)),{persistent:true});
    logger.info(`Event published to RabbitMQ. Routing Key: ${routingKey}, Message: ${JSON.stringify(message)}`);
}
module.exports = {connectRabbitMQ}