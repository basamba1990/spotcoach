// src/services/SpotCoachIntegrationService.ts
export class SpotCoachIntegrationService {
  async generatePersonalizedConnections(userId: string): Promise<ConnectionRecommendation[]> {
    const [matches, astroProfile, personality] = await Promise.all([
      this.matchingService.findOptimalMatches(userId),
      this.astroService.getUserAstroProfile(userId),
      this.personalityService.getUserPersonality(userId)
    ]);

    return matches.map(match => ({
      targetUser: match.userId,
      connectionType: this.determineConnectionType(astroProfile, match.astroProfile),
      recommendedActivities: this.suggestJointActivities(personality, match.personality),
      communicationTips: this.generateCommunicationTips(astroProfile, match.astroProfile),
      potentialSynergies: this.identifySynergies(astroProfile, match.astroProfile),
      successProbability: match.combinedScore
    }));
  }

  private determineConnectionType(astroA: AstroProfile, astroB: AstroProfile): string {
    const elementCompat = this.getElementCompatibility(astroA.dominantElement, astroB.dominantElement);
    
    if (elementCompat > 0.8) return 'collaboration_creative';
    if (elementCompat > 0.6) return 'partenariat_equilibre';
    return 'complementarite_dynamique';
  }
}
