import { redis } from '../../config/RedisConection'; // Importas la conexión global
import { ICacheRepository } from '../domain/ICacheRepository';
import Redis from 'ioredis';

export default class RedisClient implements ICacheRepository {
    private client: Redis;

    constructor() {
        this.client = redis; 
    }

    async get(key: string): Promise<string | null> {
        try {
            return await this.client.get(key);
        } catch (error) {
            console.error(`Error getting key ${key}:`, error);
            return null;
        }
    }

    async set(key: string, value: string, ttl: number): Promise<void> {
        if (ttl <= 0) {
            throw new Error('TTL must be a positive number');
        }
        await this.client.set(key, value, 'EX', ttl);
    }

    async del(key: string): Promise<void> {
        await this.client.del(key);
    }

    async keys(pattern: string): Promise<string[]> {
        return this.client.keys(pattern);
    }

    async disconnect (): Promise<void> {
        await this.client.quit();
    }
}
