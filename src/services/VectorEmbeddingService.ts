// src/services/VectorEmbeddingService.ts
import OpenAI from 'openai';
import { DatabaseService } from './DatabaseService';

export interface UserProfileForEmbedding {
  astroProfile: AstroProfile;
  personality: PersonalityProfile;
  passions: string[];
  goals: string[];
  communicationStyle: string;
  sportInterests: SportInterest[];
}

export class VectorEmbeddingService {
  private openai: OpenAI;
  private db: DatabaseService;

  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async generateUserEmbedding(userId: string): Promise<number[]> {
    // Récupérer profil complet
    const userProfile = await this.getCompleteUserProfile(userId);
    
    // Générer texte structuré pour embedding
    const embeddingText = this.createEmbeddingText(userProfile);
    
    // Générer embedding avec OpenAI
    const embedding = await this.generateEmbedding(embeddingText);
    
    // Sauvegarder en base
    await this.saveUserEmbedding(userId, embedding, userProfile);
    
    return embedding;
  }

  private createEmbeddingText(profile: UserProfileForEmbedding): string {
    return `
PROFIL COMPOSITE UTILISATEUR:

ARCHÉTYPE PRINCIPAL: ${profile.astroProfile.sunArchetype}
ÉLÉMENT DOMINANT: ${profile.astroProfile.dominantElement}
ÉNERGIE: ${profile.astroProfile.energyType}

PERSONNALITÉ:
- Traits: ${profile.personality.dominantTraits.join(', ')}
- Style communication: ${profile.communicationStyle}
- Valeurs: ${profile.personality.coreValues.join(', ')}

PASSIONS & INTÉRÊTS:
- Sports: ${profile.sportInterests.map(s => s.name).join(', ')}
- Niveau: ${profile.sportInterests.map(s => s.level).join(', ')}
- Centres d'intérêt: ${profile.passions.join(', ')}

OBJECTIFS:
${profile.goals.map(goal => `- ${goal}`).join('\n')}

TALENTS NATURELS:
- ${profile.astroProfile.naturalTalents.join('\n- ')}

ZONES DE DÉVELOPPEMENT:
- ${profile.astroProfile.challengeAreas.join('\n- ')}
`;
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: "text-embedding-3-large",
      input: text,
      encoding_format: "float"
    });

    return response.data[0].embedding;
  }

  async findComplementaryMatches(
    userId: string, 
    limit: number = 10,
    matchStrategy: 'complementary' | 'similar' | 'balanced' = 'complementary'
  ): Promise<MatchResult[]> {
    const userEmbedding = await this.getUserEmbedding(userId);
    if (!userEmbedding) {
      throw new Error('Embedding utilisateur non trouvé');
    }

    // Recherche vectorielle dans la base
    const vectorMatches = await this.findVectorMatches(userEmbedding, limit * 2);
    
    // Enrichissement avec logique métier
    const enrichedMatches = await this.enrichWithBusinessLogic(
      userId, 
      vectorMatches, 
      matchStrategy
    );

    return enrichedMatches.slice(0, limit);
  }

  private async findVectorMatches(
    queryEmbedding: number[], 
    limit: number
  ): Promise<VectorMatch[]> {
    // Requête SQL avec pg_vector
    const { data, error } = await this.db.supabase
      .from('user_embeddings')
      .select(`
        user_id,
        embedding,
        metadata
      `)
      .neq('user_id', this.currentUserId)
      .select(`*, similarity:embedding <=> '[${queryEmbedding.join(',')}]'::vector`)
      .order('similarity', { ascending: true }) // Plus petit = plus similaire
      .limit(limit);

    if (error) throw error;

    return data.map(item => ({
      userId: item.user_id,
      similarity: 1 - item.similarity, // Convertir en score de similarité
      metadata: item.metadata
    }));
  }
}
