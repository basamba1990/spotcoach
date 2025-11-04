// src/services/VectorEmbeddingService.ts
import OpenAI from 'openai'
import { DatabaseService } from './DatabaseService'
import { RedisCache } from '../utils/redis-cache'

export class VectorEmbeddingService {
  private openai: OpenAI
  private db: DatabaseService
  private cache: RedisCache

  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    this.db = new DatabaseService()
    this.cache = new RedisCache()
  }

  async generateUserEmbedding(userId: string): Promise<number[]> {
    const userProfile = await this.getCompleteUserProfile(userId)
    const embeddingText = this.createEmbeddingText(userProfile)
    const embedding = await this.generateEmbedding(embeddingText)
    
    await this.saveUserEmbedding(userId, embedding, userProfile)
    
    return embedding
  }

  private async getCompleteUserProfile(userId: string): Promise<CompleteUserProfile> {
    const [user, profile, astroData, personality] = await Promise.all([
      this.db.getUserById(userId),
      this.db.getUserProfile(userId),
      this.db.getAstroData(userId),
      this.db.getPersonalityProfile(userId)
    ])

    return {
      ...user,
      profile,
      astroData,
      personality
    }
  }

  private createEmbeddingText(profile: CompleteUserProfile): string {
    return `
PROFIL COMPOSITE UTILISATEUR:

INFORMATIONS PERSONNELLES:
- Nom: ${profile.full_name}
- Groupe d'âge: ${profile.age_group}
- Bio: ${profile.bio || 'Non renseigné'}

PROFIL ASTROLOGIQUE:
- Soleil: ${profile.astroData?.sunSign} en ${profile.astroData?.sunHouse}ème maison
- Lune: ${profile.astroData?.moonSign} en ${profile.astroData?.moonHouse}ème maison
- Ascendant: ${profile.astroData?.risingSign}
- Élément dominant: ${profile.astroData?.dominantElement}
- Mode dominant: ${profile.astroData?.dominantMode}

PROFIL DE PERSONNALITÉ:
- Couleur dominante: ${profile.personality?.dominantColor}
- Traits principaux: ${profile.personality?.traits?.join(', ')}
- Valeurs: ${profile.personality?.values?.join(', ')}
- Style de communication: ${profile.personality?.communicationStyle}

PASSIONS ET INTÉRÊTS:
- Sports: ${profile.profile?.sports?.join(', ') || 'Non renseigné'}
- Centres d'intérêt: ${profile.profile?.interests?.join(', ') || 'Non renseigné'}
- Compétences: ${profile.profile?.skills?.join(', ') || 'Non renseigné'}

OBJECTIFS ET ASPIRATIONS:
- Objectifs à court terme: ${profile.profile?.shortTermGoals?.join(', ') || 'Non renseigné'}
- Vision long terme: ${profile.profile?.longTermVision || 'Non renseigné'}
- Domaines de développement: ${profile.profile?.developmentAreas?.join(', ') || 'Non renseigné'}
`
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: "text-embedding-3-large",
      input: text,
      encoding_format: "float"
    })

    return response.data[0].embedding
  }

  private async saveUserEmbedding(userId: string, embedding: number[], profile: CompleteUserProfile): Promise<void> {
    await this.db.supabase
      .from('user_embeddings')
      .upsert({
        user_id: userId,
        embedding: embedding,
        metadata: {
          profile_type: 'composite',
          astro_signs: {
            sun: profile.astroData?.sunSign,
            moon: profile.astroData?.moonSign,
            rising: profile.astroData?.risingSign
          },
          personality_traits: profile.personality?.traits,
          interests: profile.profile?.interests,
          updated_at: new Date().toISOString()
        }
      })
  }

  async findComplementaryMatches(
    userId: string, 
    limit: number = 10,
    strategy: 'complementary' | 'similar' | 'balanced' = 'complementary'
  ): Promise<VectorMatch[]> {
    const userEmbedding = await this.getUserEmbedding(userId)
    if (!userEmbedding) {
      throw new Error('Embedding utilisateur non trouvé')
    }

    const vectorMatches = await this.findVectorMatches(userEmbedding, limit * 2, strategy)
    const enrichedMatches = await this.enrichWithBusinessLogic(userId, vectorMatches, strategy)

    return enrichedMatches.slice(0, limit)
  }

  private async findVectorMatches(
    queryEmbedding: number[], 
    limit: number,
    strategy: string
  ): Promise<VectorMatch[]> {
    // Pour les matches complémentaires, on cherche une dissimilarité contrôlée
    const similarityThreshold = strategy === 'complementary' ? 0.3 : 0.7
    
    const { data, error } = await this.db.supabase
      .rpc('find_similar_users', {
        query_embedding: queryEmbedding,
        similarity_threshold: similarityThreshold,
        max_results: limit
      })

    if (error) throw error

    return data.map((item: any) => ({
      userId: item.user_id,
      similarity: item.similarity,
      metadata: item.metadata
    }))
  }

  private async enrichWithBusinessLogic(
    userId: string,
    vectorMatches: VectorMatch[],
    strategy: string
  ): Promise<VectorMatch[]> {
    const userProfile = await this.getCompleteUserProfile(userId)
    
    const enriched = await Promise.all(
      vectorMatches.map(async (match) => {
        const targetProfile = await this.getCompleteUserProfile(match.userId)
        
        // Calcul de score basé sur la stratégie
        let businessScore = match.similarity
        
        if (strategy === 'complementary') {
          businessScore = this.calculateComplementarityScore(userProfile, targetProfile)
        } else if (strategy === 'balanced') {
          businessScore = (match.similarity + this.calculateComplementarityScore(userProfile, targetProfile)) / 2
        }

        return {
          ...match,
          businessScore,
          complementaryAspects: this.identifyComplementaryAspects(userProfile, targetProfile),
          matchType: this.determineMatchType(userProfile, targetProfile)
        }
      })
    )

    return enriched.sort((a, b) => b.businessScore - a.businessScore)
  }

  private calculateComplementarityScore(profileA: CompleteUserProfile, profileB: CompleteUserProfile): number {
    let score = 0
    const maxScore = 5

    // Complémentarité des éléments astrologiques
    score += this.getElementComplementarity(profileA.astroData, profileB.astroData)
    
    // Complémentarité des couleurs de personnalité
    score += this.getColorComplementarity(profileA.personality, profileB.personality)
    
    // Complémentarité des compétences
    score += this.getSkillsComplementarity(profileA.profile, profileB.profile)
    
    // Intérêts communs (bonus)
    score += this.getSharedInterests(profileA.profile, profileB.profile)

    return Math.min(1, score / maxScore)
  }

  private getElementComplementarity(astroA: AstroData, astroB: AstroData): number {
    const elementCompatibilities = {
      fire: { fire: 0.2, earth: 0.8, air: 0.6, water: 0.4 },
      earth: { fire: 0.8, earth: 0.2, air: 0.4, water: 0.6 },
      air: { fire: 0.6, earth: 0.4, air: 0.2, water: 0.8 },
      water: { fire: 0.4, earth: 0.6, air: 0.8, water: 0.2 }
    }

    return elementCompatibilities[astroA.dominantElement]?.[astroB.dominantElement] || 0.5
  }

  private async getUserEmbedding(userId: string): Promise<number[] | null> {
    const { data, error } = await this.db.supabase
      .from('user_embeddings')
      .select('embedding')
      .eq('user_id', userId)
      .single()

    if (error || !data) return null
    return data.embedding
  }
}
