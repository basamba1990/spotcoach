// src/services/ProjectRecommendationService.ts
export interface CollaborativeProject {
  id: string;
  title: string;
  description: string;
  projectType: ProjectType;
  requiredSkills: string[];
  complementaryRoles: ProjectRole[];
  estimatedDuration: string;
  difficulty: 'débutant' | 'intermédiaire' | 'avancé';
  potentialImpact: number;
  resourcesNeeded: string[];
  successMetrics: string[];
}

export class ProjectRecommendationService {
  private matchingService: ComplementaryMatchingService;
  private openAIService: OpenAIService;
  private db: DatabaseService;

  async generateCollaborativeProjects(
    userId: string, 
    partnerId: string
  ): Promise<CollaborativeProject[]> {
    
    // Analyse détaillée de la synergie
    const synergyAnalysis = await this.analyzeSynergy(userId, partnerId);
    
    // Génération de projets IA
    const aiProjects = await this.generateAIProjects(synergyAnalysis);
    
    // Filtrage par faisabilité
    const feasibleProjects = await this.filterByFeasibility(aiProjects, userId, partnerId);
    
    // Enrichissement avec ressources
    return await this.enrichWithResources(feasibleProjects);
  }

  private async analyzeSynergy(userId: string, partnerId: string): Promise<SynergyAnalysis> {
    const [userProfile, partnerProfile, matchAnalysis] = await Promise.all([
      this.getCompleteUserProfile(userId),
      this.getCompleteUserProfile(partnerId),
      this.matchingService.getDetailedMatchAnalysis(userId, partnerId)
    ]);

    return {
      complementarySkills: this.findComplementarySkills(userProfile, partnerProfile),
      sharedPassions: this.findSharedPassions(userProfile, partnerProfile),
      energySynergy: this.calculateEnergySynergy(userProfile.astroProfile, partnerProfile.astroProfile),
      communicationStyle: this.analyzeCommunicationSynergy(userProfile, partnerProfile),
      growthOpportunities: this.identifyGrowthOpportunities(userProfile, partnerProfile)
    };
  }

  private async generateAIProjects(synergy: SynergyAnalysis): Promise<CollaborativeProject[]> {
    const prompt = `
Génère des idées de projets collaboratifs basées sur cette synergie :

COMPLÉMENTARITÉ DES COMPÉTENCES:
- Utilisateur A excelle en: ${synergy.complementarySkills.userA}
- Utilisateur B excelle en: ${synergy.complementarySkills.userB}

PASSIONS COMMUNES:
${synergy.sharedPassions.map(p => `- ${p}`).join('\n')}

SYNERGIE ÉNERGÉTIQUE:
- Type: ${synergy.energySynergy.type}
- Potentiel: ${synergy.energySynergy.potential}/10

STYLES DE COMMUNICATION:
- Utilisateur A: ${synergy.communicationStyle.userA}
- Utilisateur B: ${synergy.communicationStyle.userB}

Génère 5 projets concrets avec:
1. Titre accrocheur
2. Description motivante
3. Rôles complémentaires
4. Durée estimée
5. Impact potentiel

Format JSON strict.
`;

    const response = await this.openAIService.generateStructuredResponse(prompt);
    return response.projects;
  }
}
