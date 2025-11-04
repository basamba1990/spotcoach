// src/services/SymbolicInterpretationService.ts
import { OpenAIService } from './OpenAIService';
import { DatabaseService } from './DatabaseService';

export class SymbolicInterpretationService {
  private openAI: OpenAIService;
  private db: DatabaseService;

  constructor() {
    this.openAI = new OpenAIService();
    this.db = new DatabaseService();
  }

  async interpretChart(
    natalChart: NatalChart, 
    userPreferences: UserPreferences, 
    sportPassion: string
  ): Promise<SpotCoachProfile> {
    
    const symbolicData = this.mapToSymbolic(natalChart);
    
    const prompt = this.buildSpotCoachPrompt(
      symbolicData, 
      userPreferences, 
      sportPassion
    );

    const interpretation = await this.openAI.generateInterpretation(prompt);
    
    return this.formatProfileResponse(interpretation, symbolicData);
  }

  private buildSpotCoachPrompt(
    symbolicData: SymbolicData, 
    preferences: UserPreferences,
    sport: string
  ): string {
    return `
En tant que SpotCoach, analyse ce profil énergétique pour ${preferences.name} :

PROFIL SYMBOLIQUE :
- Énergie Principale (Soleil) : ${symbolicData.sun.archetype} - ${symbolicData.sun.color}
- Monde Émotionnel (Lune) : ${symbolicData.moon.emotionProfile} 
- Style d'Expression (Ascendant) : ${symbolicData.rising.communicationStyle}

PASSION : ${sport}
PRÉFÉRENCES : ${preferences.goals}

Génère une guidance qui :
1. Aligne son énergie naturelle avec sa passion sportive
2. Identifie des projets concrets en rapport avec ${sport}
3. Donne des périodes favorables pour agir
4. Suggère des synergies de partenaires

Format de réponse JSON strict :
{
  "energyProfile": { ... },
  "talentMapping": { ... },
  "projectSuggestions": [...],
  "optimalTiming": { ... },
  "growthAreas": [...]
}
`;
  }
}
