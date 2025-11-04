// src/services/ComplementaryMatchingService.ts
export class ComplementaryMatchingService {
  private vectorService: VectorEmbeddingService;
  private astroService: AstroCalculationService;

  constructor() {
    this.vectorService = new VectorEmbeddingService();
    this.astroService = new AstroCalculationService();
  }

  async findOptimalMatches(userId: string): Promise<EnhancedMatch[]> {
    // 1. Matching vectoriel de base
    const vectorMatches = await this.vectorService.findComplementaryMatches(userId, 20);
    
    // 2. Analyse astrologique des compatibilités
    const astroCompatibility = await this.calculateAstroCompatibility(userId, vectorMatches);
    
    // 3. Analyse de complémentarité des personnalités
    const personalityMatches = await this.analyzePersonalityComplementarity(userId, vectorMatches);
    
    // 4. Fusion des scores avec pondérations
    const combinedMatches = this.combineMatchScores(
      vectorMatches,
      astroCompatibility,
      personalityMatches
    );

    // 5. Génération des explications IA
    return await this.generateMatchExplanations(userId, combinedMatches);
  }

  private async calculateAstroCompatibility(
    userId: string, 
    matches: VectorMatch[]
  ): Promise<AstroCompatibility[]> {
    const userAstro = await this.astroService.getUserAstroProfile(userId);
    
    return await Promise.all(
      matches.map(async (match) => {
        const targetAstro = await this.astroService.getUserAstroProfile(match.userId);
        
        return {
          userId: match.userId,
          score: this.calculateAstroSynergy(userAstro, targetAstro),
          aspects: this.analyzePlanetaryAspects(userAstro, targetAstro),
          elementsCompatibility: this.analyzeElements(userAstro, targetAstro)
        };
      })
    );
  }

  private calculateAstroSynergy(astroA: AstroProfile, astroB: AstroProfile): number {
    let score = 0;
    
    // Compatibilité des éléments
    const elementCompat = this.getElementCompatibility(astroA.dominantElement, astroB.dominantElement);
    score += elementCompat * 0.3;
    
    // Aspects planétaires harmonieux
    const aspectScore = this.analyzeHarmoniousAspects(astroA, astroB);
    score += aspectScore * 0.4;
    
    // Complémentarité des archétypes
    const archetypeScore = this.analyzeArchetypeComplementarity(astroA, astroB);
    score += archetypeScore * 0.3;
    
    return Math.min(1, Math.max(0, score));
  }

  private analyzePersonalityComplementarity(
    userId: string, 
    matches: VectorMatch[]
  ): Promise<PersonalityMatch[]> {
    // Implémentation de la logique des 4 couleurs + archétypes Jung
    // Recherche de profils complémentaires (ex: Rouge + Bleu, Intuitif + Sensoriel)
  }
}
