import { exit } from 'process';
import { createClient, RedisClientType } from 'redis';

let client: RedisClientType | null = null

async function get_create_connection(url: string = 'redis://localhost:6379') {
    if (client) {
        return client
    }

    client = createClient({
        url: url // Or your Redis server URL
    });

    client.on('error', (err) => {
        console.error('Redis Client Error', err);
        exit(1);
    });

    await client.connect();
    console.log('Connected to Redis');

    return client
}

export default get_create_connection

