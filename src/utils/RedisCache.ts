// src/utils/RedisCache.ts
import Redis from 'redis';

export class RedisCache {
  private client: Redis.RedisClientType;

  constructor() {
    this.client = Redis.createClient({
      url: process.env.REDIS_URL
    });
    this.client.connect();
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    await this.client.setEx(key, ttlSeconds, value);
  }

  async enqueueCalculation(job: CalculationJob): Promise<void> {
    await this.client.lPush('astro_calculations', JSON.stringify(job));
  }
}

// src/workers/CalculationWorker.ts
import { Worker, Job } from 'bull';

export class CalculationWorker {
  private worker: Worker;

  constructor() {
    this.worker = new Worker('astro calculations', async (job: Job) => {
      const { birthData, userId } = job.data;
      
      // Calcul intensif en arrière-plan
      const result = await this.performHeavyCalculation(birthData);
      
      // Notification via WebSocket
      this.notifyUser(userId, result);
      
      return result;
    });
  }
}
