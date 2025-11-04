// src/controllers/MatchingController.ts
import { Request, Response } from 'express'
import { ComplementaryMatchingService } from '../services/ComplementaryMatchingService'
import { RedisCache } from '../utils/redis-cache'
import { authMiddleware } from '../middleware/auth'

export class MatchingController {
  private matchingService: ComplementaryMatchingService
  private cache: RedisCache

  constructor() {
    this.matchingService = new ComplementaryMatchingService()
    this.cache = new RedisCache()
  }

  getMatches = async (req: Request, res: Response) => {
    try {
      const userId = req.user.id
      const { 
        strategy = 'complementary',
        limit = 10,
        filters = {}
      } = req.body

      const cacheKey = `matches:${userId}:${strategy}:${JSON.stringify(filters)}`
      const cached = await this.cache.get(cacheKey)
      
      if (cached) {
        return res.json(JSON.parse(cached))
      }

      const matches = await this.matchingService.findOptimalMatches(
        userId,
        strategy,
        limit,
        filters
      )

      await this.cache.set(cacheKey, JSON.stringify(matches), 3600) // 1 hour

      res.json({
        success: true,
        matches,
        strategy,
        generatedAt: new Date().toISOString()
      })

    } catch (error) {
      console.error('Matching error:', error)
      res.status(500).json({ 
        error: 'Erreur lors de la recherche de matches',
        details: error.message 
      })
    }
  }

  getMatchAnalysis = async (req: Request, res: Response) => {
    try {
      const userId = req.user.id
      const { targetUserId } = req.params

      const analysis = await this.matchingService.getDetailedMatchAnalysis(
        userId,
        targetUserId
      )

      res.json({
        success: true,
        analysis,
        generatedAt: new Date().toISOString()
      })
    } catch (error) {
      res.status(500).json({ 
        error: 'Erreur analyse match',
        details: error.message 
      })
    }
  }

  saveMatchInterest = async (req: Request, res: Response) => {
    try {
      const userId = req.user.id
      const { matchId, interest } = req.body

      await this.matchingService.saveMatchInterest(userId, matchId, interest)

      res.json({
        success: true,
        message: 'Intérêt sauvegardé avec succès'
      })
    } catch (error) {
      res.status(500).json({ 
        error: 'Erreur sauvegarde intérêt',
        details: error.message 
      })
    }
  }
}
