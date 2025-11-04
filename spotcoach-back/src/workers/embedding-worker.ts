// src/workers/embedding-worker.ts
import { Worker, Job } from 'bullmq'
import { VectorEmbeddingService } from '../services/VectorEmbeddingService'
import { DatabaseService } from '../services/DatabaseService'
import { RedisCache } from '../utils/redis-cache'

export class EmbeddingWorker {
  private worker: Worker
  private vectorService: VectorEmbeddingService
  private db: DatabaseService
  private cache: RedisCache

  constructor() {
    this.vectorService = new VectorEmbeddingService()
    this.db = new DatabaseService()
    this.cache = new RedisCache()

    this.worker = new Worker(
      'embedding-generation',
      async (job: Job) => {
        const { userId, forceRefresh = false } = job.data
        
        try {
          console.log(`🔧 Generating embedding for user ${userId}`)
          
          // Vérifier si un embedding récent existe
          if (!forceRefresh) {
            const existingEmbedding = await this.vectorService.getUserEmbedding(userId)
            if (existingEmbedding) {
              console.log(`✅ Using existing embedding for user ${userId}`)
              return { success: true, fromCache: true }
            }
          }

          // Générer un nouvel embedding
          await this.vectorService.generateUserEmbedding(userId)
          
          console.log(`✅ Embedding generated successfully for user ${userId}`)
          
          // Invalider les caches de matching
          await this.cache.del(`matches:${userId}:*`)
          
          return { success: true, fromCache: false }
        } catch (error) {
          console.error(`❌ Error generating embedding for user ${userId}:`, error)
          throw error
        }
      },
      {
        connection: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379')
        },
        concurrency: 3 // Limiter le nombre d'embedding simultanés
      }
    )

    this.setupEventHandlers()
  }

  private setupEventHandlers() {
    this.worker.on('completed', (job: Job) => {
      console.log(`🎉 Embedding job completed for user ${job.data.userId}`)
    })

    this.worker.on('failed', (job: Job | undefined, err: Error) => {
      console.error(`💥 Embedding job failed for user ${job?.data.userId}:`, err)
    })

    this.worker.on('error', (err: Error) => {
      console.error('💥 Embedding worker error:', err)
    })
  }

  async enqueueEmbeddingGeneration(userId: string, forceRefresh = false) {
    const job = await this.worker.add(
      `embedding:${userId}`,
      { userId, forceRefresh },
      {
        jobId: `embedding:${userId}:${Date.now()}`,
        removeOnComplete: 50, // Garder les 50 derniers jobs complétés
        removeOnFail: 10, // Garder les 10 derniers jobs échoués
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000
        }
      }
    )

    return job
  }

  async close() {
    await this.worker.close()
  }
}
