// src/services/ComplementaryMatchingService.ts
import { VectorEmbeddingService } from './VectorEmbeddingService'
import { AstroCalculationService } from './AstroCalculationService'
import { OpenAIService } from './OpenAIService'
import { DatabaseService } from './DatabaseService'
import { RedisCache } from '../utils/redis-cache'

export class ComplementaryMatchingService {
  private vectorService: VectorEmbeddingService
  private astroService: AstroCalculationService
  private openAIService: OpenAIService
  private db: DatabaseService
  private cache: RedisCache

  constructor() {
    this.vectorService = new VectorEmbeddingService()
    this.astroService = new AstroCalculationService()
    this.openAIService = new OpenAIService()
    this.db = new DatabaseService()
    this.cache = new RedisCache()
  }

  async findOptimalMatches(
    userId: string,
    strategy: 'complementary' | 'similar' | 'balanced' = 'complementary',
    limit: number = 10,
    filters: MatchFilters = {}
  ): Promise<EnhancedMatch[]> {
    const cacheKey = `optimal-matches:${userId}:${strategy}:${limit}:${JSON.stringify(filters)}`
    const cached = await this.cache.get<EnhancedMatch[]>(cacheKey)
    
    if (cached) {
      return cached
    }

    // 1. Matching vectoriel de base
    const vectorMatches = await this.vectorService.findComplementaryMatches(
      userId, 
      limit * 3, // Prendre plus de résultats pour le filtrage
      strategy
    )
    
    // 2. Analyse astrologique des compatibilités
    const astroCompatibility = await this.calculateAstroCompatibility(userId, vectorMatches)
    
    // 3. Analyse de complémentarité des personnalités
    const personalityMatches = await this.analyzePersonalityComplementarity(userId, vectorMatches)
    
    // 4. Fusion des scores avec pondérations
    const combinedMatches = this.combineMatchScores(
      vectorMatches,
      astroCompatibility,
      personalityMatches
    )

    // 5. Application des filtres
    const filteredMatches = this.applyFilters(combinedMatches, filters)

    // 6. Génération des explications IA
    const enrichedMatches = await this.generateMatchExplanations(userId, filteredMatches.slice(0, limit))

    await this.cache.set(cacheKey, enrichedMatches, 3600) // Cache 1h

    return enrichedMatches
  }

  private async calculateAstroCompatibility(
    userId: string, 
    matches: VectorMatch[]
  ): Promise<AstroCompatibility[]> {
    const userAstro = await this.astroService.getUserAstroProfile(userId)
    if (!userAstro) {
      return matches.map(match => ({
        userId: match.userId,
        score: 0.5,
        aspects: [],
        elementsCompatibility: 'neutral'
      }))
    }

    return await Promise.all(
      matches.map(async (match) => {
        try {
          const targetAstro = await this.astroService.getUserAstroProfile(match.userId)
          if (!targetAstro) {
            return {
              userId: match.userId,
              score: 0.5,
              aspects: [],
              elementsCompatibility: 'neutral'
            }
          }

          return {
            userId: match.userId,
            score: this.calculateAstroSynergy(userAstro, targetAstro),
            aspects: this.analyzePlanetaryAspects(userAstro, targetAstro),
            elementsCompatibility: this.analyzeElements(userAstro, targetAstro)
          }
        } catch (error) {
          console.error(`Error calculating astro compatibility for ${match.userId}:`, error)
          return {
            userId: match.userId,
            score: 0.5,
            aspects: [],
            elementsCompatibility: 'neutral'
          }
        }
      })
    )
  }

  private calculateAstroSynergy(astroA: AstroProfile, astroB: AstroProfile): number {
    let score = 0
    
    // Compatibilité des éléments (30%)
    const elementCompat = this.getElementCompatibility(astroA.dominantElement, astroB.dominantElement)
    score += elementCompat * 0.3
    
    // Aspects planétaires harmonieux (40%)
    const aspectScore = this.analyzeHarmoniousAspects(astroA, astroB)
    score += aspectScore * 0.4
    
    // Complémentarité des archétypes (30%)
    const archetypeScore = this.analyzeArchetypeComplementarity(astroA, astroB)
    score += archetypeScore * 0.3
    
    return Math.min(1, Math.max(0, score))
  }

  private analyzeHarmoniousAspects(astroA: AstroProfile, astroB: AstroProfile): number {
    let harmoniousAspects = 0
    let totalAspects = 0

    // Analyser les aspects entre planètes personnelles
    const personalPlanets = ['SUN', 'MOON', 'MERCURY', 'VENUS', 'MARS']
    
    for (const planetA of personalPlanets) {
      for (const planetB of personalPlanets) {
        const aspect = this.findAspect(astroA.planets[planetA], astroB.planets[planetB])
        if (aspect) {
          totalAspects++
          if (aspect.nature === 'harmonic') {
            harmoniousAspects++
          }
        }
      }
    }

    return totalAspects > 0 ? harmoniousAspects / totalAspects : 0.5
  }

  private analyzeArchetypeComplementarity(astroA: AstroProfile, astroB: AstroProfile): number {
    const archetypeCompatibilities = {
      pioneer: { pioneer: 0.6, guardian: 0.8, mystic: 0.7, scholar: 0.5 },
      guardian: { pioneer: 0.8, guardian: 0.4, mystic: 0.6, scholar: 0.9 },
      mystic: { pioneer: 0.7, guardian: 0.6, mystic: 0.5, scholar: 0.8 },
      scholar: { pioneer: 0.5, guardian: 0.9, mystic: 0.8, scholar: 0.4 }
    }

    return archetypeCompatibilities[astroA.archetype]?.[astroB.archetype] || 0.5
  }

  private getElementCompatibility(elementA: string, elementB: string): number {
    const elementCompatibilities = {
      fire: { fire: 0.6, earth: 0.8, air: 0.7, water: 0.4 },
      earth: { fire: 0.8, earth: 0.5, air: 0.4, water: 0.7 },
      air: { fire: 0.7, earth: 0.4, air: 0.6, water: 0.8 },
      water: { fire: 0.4, earth: 0.7, air: 0.8, water: 0.5 }
    }

    return elementCompatibilities[elementA]?.[elementB] || 0.5
  }

  private async analyzePersonalityComplementarity(
    userId: string, 
    matches: VectorMatch[]
  ): Promise<PersonalityMatch[]> {
    const userPersonality = await this.db.getPersonalityProfile(userId)
    
    return await Promise.all(
      matches.map(async (match) => {
        const targetPersonality = await this.db.getPersonalityProfile(match.userId)
        
        return {
          userId: match.userId,
          score: this.calculatePersonalityComplementarity(userPersonality, targetPersonality),
          complementaryTraits: this.findComplementaryTraits(userPersonality, targetPersonality),
          communicationStyle: this.analyzeCommunicationCompatibility(userPersonality, targetPersonality)
        }
      })
    )
  }

  private calculatePersonalityComplementarity(personalityA: PersonalityProfile, personalityB: PersonalityProfile): number {
    // Logique des 4 couleurs
    const colorCompatibilities = {
      red: { red: 0.4, blue: 0.8, green: 0.6, yellow: 0.7 },
      blue: { red: 0.8, blue: 0.3, green: 0.9, yellow: 0.5 },
      green: { red: 0.6, blue: 0.9, green: 0.5, yellow: 0.8 },
      yellow: { red: 0.7, blue: 0.5, green: 0.8, yellow: 0.4 }
    }

    const colorScore = colorCompatibilities[personalityA.dominantColor]?.[personalityB.dominantColor] || 0.5

    // Complémentarité des traits
    const traitComplementarity = this.analyzeTraitComplementarity(personalityA.traits, personalityB.traits)

    return (colorScore * 0.6 + traitComplementarity * 0.4)
  }

  private analyzeTraitComplementarity(traitsA: string[], traitsB: string[]): number {
    const complementaryPairs = [
      ['analytical', 'creative'],
      ['structured', 'flexible'],
      ['assertive', 'receptive'],
      ['detailed', 'big_picture'],
      ['practical', 'visionary']
    ]

    let complementaryCount = 0
    
    for (const [traitA, traitB] of complementaryPairs) {
      if ((traitsA.includes(traitA) && traitsB.includes(traitB)) ||
          (traitsA.includes(traitB) && traitsB.includes(traitA))) {
        complementaryCount++
      }
    }

    return complementaryCount / complementaryPairs.length
  }

  private combineMatchScores(
    vectorMatches: VectorMatch[],
    astroCompatibility: AstroCompatibility[],
    personalityMatches: PersonalityMatch[]
  ): CombinedMatch[] {
    return vectorMatches.map(vectorMatch => {
      const astroMatch = astroCompatibility.find(m => m.userId === vectorMatch.userId)
      const personalityMatch = personalityMatches.find(m => m.userId === vectorMatch.userId)

      const vectorScore = vectorMatch.similarity
      const astroScore = astroMatch?.score || 0.5
      const personalityScore = personalityMatch?.score || 0.5

      // Pondérations ajustables
      const combinedScore = (
        vectorScore * 0.4 +
        astroScore * 0.3 +
        personalityScore * 0.3
      )

      return {
        ...vectorMatch,
        combinedScore,
        astroCompatibility: astroMatch,
        personalityMatch: personalityMatch,
        matchType: this.determineMatchType(combinedScore, vectorScore, astroScore, personalityScore)
      }
    }).sort((a, b) => b.combinedScore - a.combinedScore)
  }

  private determineMatchType(
    combinedScore: number,
    vectorScore: number,
    astroScore: number,
    personalityScore: number
  ): string {
    if (combinedScore >= 0.8) return 'excellent'
    if (combinedScore >= 0.7) return 'strong'
    if (combinedScore >= 0.6) return 'good'
    if (combinedScore >= 0.5) return 'moderate'
    return 'basic'
  }

  private applyFilters(matches: CombinedMatch[], filters: MatchFilters): CombinedMatch[] {
    let filtered = matches

    if (filters.minScore) {
      filtered = filtered.filter(m => m.combinedScore >= filters.minScore!)
    }

    if (filters.matchTypes && filters.matchTypes.length > 0) {
      filtered = filtered.filter(m => filters.matchTypes!.includes(m.matchType))
    }

    if (filters.hasAstroData) {
      filtered = filtered.filter(m => m.astroCompatibility && m.astroCompatibility.score > 0)
    }

    return filtered
  }

  private async generateMatchExplanations(userId: string, matches: CombinedMatch[]): Promise<EnhancedMatch[]> {
    const userProfile = await this.db.getCompleteUserProfile(userId)
    
    return await Promise.all(
      matches.map(async (match) => {
        const targetProfile = await this.db.getCompleteUserProfile(match.userId)
        
        const explanation = await this.openAIService.generateMatchExplanation(
          userProfile,
          targetProfile,
          match
        )

        return {
          ...match,
          explanation,
          user: {
            id: targetProfile.id,
            full_name: targetProfile.full_name,
            avatar_url: targetProfile.avatar_url,
            bio: targetProfile.bio,
            age_group: targetProfile.age_group,
            passions: targetProfile.passions
          }
        }
      })
    )
  }

  async getDetailedMatchAnalysis(userId: string, targetUserId: string): Promise<DetailedMatchAnalysis> {
    const [userProfile, targetProfile] = await Promise.all([
      this.db.getCompleteUserProfile(userId),
      this.db.getCompleteUserProfile(targetUserId)
    ])

    const match = await this.findOptimalMatches(userId, 'complementary', 1, {
      targetUserId: targetUserId
    }).then(matches => matches[0])

    if (!match) {
      throw new Error('Match analysis not found')
    }

    const analysis = await this.openAIService.generateDetailedAnalysis(
      userProfile,
      targetProfile,
      match
    )

    return {
      overallScore: match.combinedScore,
      synergyLevel: Math.round(match.combinedScore * 100),
      compatibilityBreakdown: {
        communication: Math.round((match.personalityMatch?.communicationStyle.compatibility || 0.5) * 100),
        values: Math.round((match.vectorScore || 0.5) * 100),
        interests: this.calculateInterestsCompatibility(userProfile.interests, targetProfile.interests),
        energy: Math.round((match.astroCompatibility?.score || 0.5) * 100),
        goals: this.calculateGoalsCompatibility(userProfile.goals, targetProfile.goals)
      },
      strengths: analysis.strengths,
      challenges: analysis.challenges,
      recommendations: analysis.recommendations,
      astroCompatibility: {
        sun: this.getAspectDescription(match.astroCompatibility?.aspects, 'SUN'),
        moon: this.getAspectDescription(match.astroCompatibility?.aspects, 'MOON'),
        rising: this.getRisingCompatibility(userProfile.astroData, targetProfile.astroData),
        energy: match.astroCompatibility?.elementsCompatibility || 'neutral'
      }
    }
  }

  private calculateInterestsCompatibility(interestsA: string[], interestsB: string[]): number {
    const commonInterests = interestsA.filter(interest => interestsB.includes(interest))
    const totalUniqueInterests = new Set([...interestsA, ...interestsB]).size
    
    return totalUniqueInterests > 0 ? commonInterests.length / totalUniqueInterests * 100 : 50
  }

  private calculateGoalsCompatibility(goalsA: string[], goalsB: string[]): number {
    // Logique de compatibilité des objectifs de vie
    const goalCategories = {
      career: ['advancement', 'business', 'leadership'],
      personal: ['growth', 'health', 'learning'],
      relational: ['family', 'friendship', 'community'],
      spiritual: ['purpose', 'meaning', 'contribution']
    }

    let compatibleGoals = 0
    let totalGoals = 0

    for (const [category, keywords] of Object.entries(goalCategories)) {
      const hasCommonCategory = goalsA.some(goal => 
        keywords.some(keyword => goal.toLowerCase().includes(keyword))
      ) && goalsB.some(goal => 
        keywords.some(keyword => goal.toLowerCase().includes(keyword))
      )

      if (hasCommonCategory) {
        compatibleGoals++
      }
      totalGoals++
    }

    return totalGoals > 0 ? (compatibleGoals / totalGoals) * 100 : 50
  }

  private getAspectDescription(aspects: AstroAspect[] = [], planet: string): string {
    const planetAspects = aspects.filter(aspect => 
      aspect.planetA === planet || aspect.planetB === planet
    )

    if (planetAspects.length === 0) return 'neutre'

    const harmonious = planetAspects.filter(a => a.nature === 'harmonic').length
    const challenging = planetAspects.filter(a => a.nature === 'challenging').length

    if (harmonious > challenging) return 'harmonieux'
    if (challenging > harmonious) return 'stimulant'
    return 'équilibré'
  }

  private getRisingCompatibility(astroA: AstroData, astroB: AstroData): string {
    const risingElements = {
      Aries: 'fire', Taurus: 'earth', Gemini: 'air', Cancer: 'water',
      Leo: 'fire', Virgo: 'earth', Libra: 'air', Scorpio: 'water',
      Sagittarius: 'fire', Capricorn: 'earth', Aquarius: 'air', Pisces: 'water'
    }

    const elementA = risingElements[astroA.risingSign]
    const elementB = risingElements[astroB.risingSign]

    const elementCompat = this.getElementCompatibility(elementA, elementB)
    
    if (elementCompat >= 0.7) return 'très compatible'
    if (elementCompat >= 0.5) return 'compatible'
    return 'complémentaire'
  }

  async saveMatchInterest(userId: string, matchId: string, interest: boolean): Promise<void> {
    await this.db.supabase
      .from('match_interests')
      .upsert({
        user_id: userId,
        match_id: matchId,
        interest_level: interest ? 1 : 0,
        interacted_at: new Date().toISOString()
      })
  }
}
