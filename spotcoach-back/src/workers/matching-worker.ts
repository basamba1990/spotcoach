// src/workers/matching-worker.ts
import { Worker, Job } from 'bullmq'
import { ComplementaryMatchingService } from '../services/ComplementaryMatchingService'
import { DatabaseService } from '../services/DatabaseService'
import { RedisCache } from '../utils/redis-cache'

export class MatchingWorker {
  private worker: Worker
  private matchingService: ComplementaryMatchingService
  private db: DatabaseService
  private cache: RedisCache

  constructor() {
    this.matchingService = new ComplementaryMatchingService()
    this.db = new DatabaseService()
    this.cache = new RedisCache()

    this.worker = new Worker(
      'match-calculation',
      async (job: Job) => {
        const { userId, strategy = 'complementary', limit = 20 } = job.data
        
        try {
          console.log(`🔧 Calculating matches for user ${userId}`)
          
          const matches = await this.matchingService.findOptimalMatches(
            userId,
            strategy,
            limit
          )

          // Sauvegarder les résultats
          await this.saveMatchResults(userId, matches)
          
          console.log(`✅ Found ${matches.length} matches for user ${userId}`)
          
          return {
            success: true,
            matchCount: matches.length,
            generatedAt: new Date().toISOString()
          }
        } catch (error) {
          console.error(`❌ Error calculating matches for user ${userId}:`, error)
          throw error
        }
      },
      {
        connection: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379')
        },
        concurrency: 2 // Limiter le matching simultané
      }
    )

    this.setupEventHandlers()
  }

  private async saveMatchResults(userId: string, matches: EnhancedMatch[]) {
    // Sauvegarder les matches en base de données
    for (const match of matches) {
      await this.db.supabase
        .from('calculated_matches')
        .upsert({
          user_id: userId,
          matched_user_id: match.userId,
          similarity_score: match.combinedScore,
          match_type: match.matchType,
          complementary_aspects: match.complementaryAspects,
          explanation: match.explanation,
          calculated_at: new Date().toISOString()
        })
    }

    // Mettre à jour le cache
    await this.cache.set(
      `matches:${userId}:${matches[0]?.matchType || 'complementary'}`,
      matches,
      3600 // 1 heure
    )
  }

  private setupEventHandlers() {
    this.worker.on('completed', (job: Job) => {
      console.log(`🎉 Match calculation completed for user ${job.data.userId}`)
    })

    this.worker.on('failed', (job: Job | undefined, err: Error) => {
      console.error(`💥 Match calculation failed for user ${job?.data.userId}:`, err)
    })
  }

  async enqueueMatchCalculation(userId: string, strategy = 'complementary', limit = 20) {
    const job = await this.worker.add(
      `matching:${userId}`,
      { userId, strategy, limit },
      {
        jobId: `matching:${userId}:${Date.now()}`,
        removeOnComplete: 100,
        removeOnFail: 20,
        attempts: 2,
        backoff: {
          type: 'fixed',
          delay: 5000
        }
      }
    )

    return job
  }

  async close() {
    await this.worker.close()
  }
}
