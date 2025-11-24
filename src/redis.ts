import { exit } from 'process';
import { createClient, RedisClientType } from 'redis';
import { redisLog } from './LogConfig';

let client: RedisClientType | null = null

const REDIS_URL = process.env["REDIS_URL"] ?? 'redis://localhost:6379'

async function get_create_connection(url: string = REDIS_URL) {
    if (client) {
        return client
    }

    client = createClient({
        url: url // Or your Redis server URL
    });

    client.on('error', (err) => {
        redisLog.error('Redis Client Error', err);
        exit(1);
    });

    await client.connect();
    redisLog.info('Connected to Redis');

    return client
}

export default get_create_connection

