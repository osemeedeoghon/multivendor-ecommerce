const amqp = require('amqplib');

let connection = null;
let channel = null;

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';

async function connect() {
    while (!connection) {
        try {
            connection = await amqp.connect(RABBITMQ_URL);
            channel = await connection.createChannel();
            console.log('Connected to RabbitMQ');
            connection.on('error', (err) => {
                console.error('RabbitMQ connection error:', err);
                connection = null;
                channel = null;
                setTimeout(connect, 5000);
            });
            connection.on('close', () => {
                console.error('RabbitMQ connection closed');
                connection = null;
                channel = null;
                setTimeout(connect, 5000);
            });
        } catch (err) {
            console.error('Failed to connect to RabbitMQ:', err.message);
            connection = null;
            channel = null;
            await new Promise((resolve) => setTimeout(resolve, 5000));
        }
    }
}

async function publish(exchange, routingKey, message) {
    if (!channel) throw new Error('RabbitMQ channel not initialized');
    await channel.assertExchange(exchange, 'topic', { durable: true });
    channel.publish(
        exchange,
        routingKey,
        Buffer.from(JSON.stringify(message)),
        { persistent: true }
    );
}

async function subscribe(exchange, routingKey, queueName, handler) {
    if (!channel) throw new Error('RabbitMQ channel not initialized');
    await channel.assertExchange(exchange, 'topic', { durable: true });
    await channel.assertQueue(queueName, { durable: true });
    await channel.bindQueue(queueName, exchange, routingKey);

    channel.consume(
        queueName,
        async (msg) => {
            if (msg !== null) {
                try {
                    const content = JSON.parse(msg.content.toString());
                    await handler(content);
                    channel.ack(msg);
                } catch (err) {
                    console.error('Error handling message:', err);
                    // Optionally: channel.nack(msg, false, false);
                }
            }
        },
        { noAck: false }
    );
}

function getChannel() {
    return channel;
}

module.exports = {
    connect,
    publish,
    subscribe,
    getChannel,
};