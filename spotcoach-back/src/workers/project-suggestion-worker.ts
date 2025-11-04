// src/workers/project-suggestion-worker.ts
import { Worker, Job } from 'bullmq'
import { ProjectRecommendationService } from '../services/ProjectRecommendationService'
import { DatabaseService } from '../services/DatabaseService'
import { RedisCache } from '../utils/redis-cache'

export class ProjectSuggestionWorker {
  private worker: Worker
  private projectService: ProjectRecommendationService
  private db: DatabaseService
  private cache: RedisCache

  constructor() {
    this.projectService = new ProjectRecommendationService()
    this.db = new DatabaseService()
    this.cache = new RedisCache()

    this.worker = new Worker(
      'project-suggestions',
      async (job: Job) => {
        const { userId, partnerId, projectCount = 5 } = job.data
        
        try {
          console.log(`🔧 Generating projects for users ${userId} and ${partnerId}`)
          
          const projects = await this.projectService.generateCollaborativeProjects(
            userId,
            partnerId,
            projectCount
          )

          // Sauvegarder les suggestions
          await this.saveProjectSuggestions(userId, partnerId, projects)
          
          console.log(`✅ Generated ${projects.length} projects for users ${userId} and ${partnerId}`)
          
          return {
            success: true,
            projectCount: projects.length,
            generatedAt: new Date().toISOString()
          }
        } catch (error) {
          console.error(`❌ Error generating projects for users ${userId} and ${partnerId}:`, error)
          throw error
        }
      },
      {
        connection: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379')
        },
        concurrency: 2
      }
    )

    this.setupEventHandlers()
  }

  private async saveProjectSuggestions(
    userId: string, 
    partnerId: string, 
    projects: CollaborativeProject[]
  ) {
    for (const project of projects) {
      await this.db.supabase
        .from('project_suggestions')
        .upsert({
          user_a_id: userId,
          user_b_id: partnerId,
          project_data: project,
          match_score: project.potentialImpact / 10, // Normaliser le score
          feasibility_score: this.calculateFeasibility(project),
          status: 'suggested',
          created_at: new Date().toISOString()
        })
    }

    // Mettre à jour le cache
    await this.cache.set(
      `projects:${userId}:${partnerId}`,
      projects,
      7200 // 2 heures
    )
  }

  private calculateFeasibility(project: CollaborativeProject): number {
    // Calcul simplifié de la faisabilité basée sur la difficulté et la durée
    const difficultyScores = {
      'débutant': 0.9,
      'intermédiaire': 0.7,
      'avancé': 0.5
    }

    const durationScores = {
      '2-4 semaines': 0.9,
      '1-2 mois': 0.7,
      '3-6 mois': 0.5,
      '6+ mois': 0.3
    }

    const difficultyScore = difficultyScores[project.difficulty] || 0.5
    const durationScore = durationScores[project.estimatedDuration] || 0.5

    return (difficultyScore + durationScore) / 2
  }

  private setupEventHandlers() {
    this.worker.on('completed', (job: Job) => {
      console.log(`🎉 Project generation completed for users ${job.data.userId} and ${job.data.partnerId}`)
    })

    this.worker.on('failed', (job: Job | undefined, err: Error) => {
      console.error(`💥 Project generation failed for users ${job?.data.userId} and ${job?.data.partnerId}:`, err)
    })
  }

  async enqueueProjectGeneration(userId: string, partnerId: string, projectCount = 5) {
    const job = await this.worker.add(
      `projects:${userId}:${partnerId}`,
      { userId, partnerId, projectCount },
      {
        jobId: `projects:${userId}:${partnerId}:${Date.now()}`,
        removeOnComplete: 50,
        removeOnFail: 10,
        attempts: 2
      }
    )

    return job
  }

  async close() {
    await this.worker.close()
  }
}
