// src/controllers/MatchingController.ts
export class MatchingController {
  private matchingService: ComplementaryMatchingService;
  private cache: RedisCache;

  constructor() {
    this.matchingService = new ComplementaryMatchingService();
    this.cache = new RedisCache();
  }

  async findMatches(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const { 
        strategy = 'complementary',
        limit = 10,
        filters = {}
      } = req.body;

      const cacheKey = `matches:${userId}:${strategy}:${JSON.stringify(filters)}`;
      const cached = await this.cache.get(cacheKey);
      
      if (cached) {
        return res.json(JSON.parse(cached));
      }

      const matches = await this.matchingService.findOptimalMatches(
        userId,
        strategy,
        limit,
        filters
      );

      // Cache pour 1 heure
      await this.cache.set(cacheKey, JSON.stringify(matches), 3600);

      res.json({
        success: true,
        matches,
        strategy,
        generatedAt: new Date().toISOString()
      });

    } catch (error) {
      console.error('Matching error:', error);
      res.status(500).json({ error: 'Erreur recherche matches' });
    }
  }

  async getMatchAnalysis(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const { targetUserId } = req.params;

      const analysis = await this.matchingService.getDetailedMatchAnalysis(
        userId,
        targetUserId
      );

      res.json(analysis);
    } catch (error) {
      res.status(500).json({ error: 'Erreur analyse match' });
    }
  }
}
