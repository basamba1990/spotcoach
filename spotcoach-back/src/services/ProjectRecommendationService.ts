// src/services/ProjectRecommendationService.ts
import { OpenAIService } from './OpenAIService'
import { DatabaseService } from './DatabaseService'
import { ComplementaryMatchingService } from './ComplementaryMatchingService'

export interface CollaborativeProject {
  id: string
  title: string
  description: string
  projectType: ProjectType
  requiredSkills: string[]
  complementaryRoles: ProjectRole[]
  estimatedDuration: string
  difficulty: 'débutant' | 'intermédiaire' | 'avancé'
  potentialImpact: number
  resourcesNeeded: string[]
  successMetrics: string[]
  suggestedTimeline: ProjectTimeline[]
  potentialChallenges: string[]
  mitigationStrategies: string[]
}

export interface SynergyAnalysis {
  complementarySkills: {
    userA: string[]
    userB: string[]
    combined: string[]
  }
  sharedPassions: string[]
  energySynergy: {
    type: string
    potential: number
    description: string
  }
  communicationStyle: {
    userA: string
    userB: string
    compatibility: number
  }
  growthOpportunities: string[]
  potentialBlockers: string[]
}

export class ProjectRecommendationService {
  private openAI: OpenAIService
  private db: DatabaseService
  private matchingService: ComplementaryMatchingService

  constructor() {
    this.openAI = new OpenAIService()
    this.db = new DatabaseService()
    this.matchingService = new ComplementaryMatchingService()
  }

  async generateCollaborativeProjects(
    userId: string, 
    partnerId: string,
    projectCount: number = 5
  ): Promise<CollaborativeProject[]> {
    
    const cacheKey = `projects:${userId}:${partnerId}:${projectCount}`
    const cached = await this.db.cache.get<CollaborativeProject[]>(cacheKey)
    
    if (cached) {
      return cached
    }

    const synergyAnalysis = await this.analyzeSynergy(userId, partnerId)
    const aiProjects = await this.generateAIProjects(synergyAnalysis, projectCount)
    const feasibleProjects = await this.filterByFeasibility(aiProjects, userId, partnerId)
    const enrichedProjects = await this.enrichWithResources(feasibleProjects)

    await this.db.cache.set(cacheKey, enrichedProjects, 3600) // Cache 1h

    return enrichedProjects
  }

  private async analyzeSynergy(userId: string, partnerId: string): Promise<SynergyAnalysis> {
    const [userProfile, partnerProfile, matchAnalysis] = await Promise.all([
      this.getCompleteUserProfile(userId),
      this.getCompleteUserProfile(partnerId),
      this.matchingService.getDetailedMatchAnalysis(userId, partnerId)
    ])

    return {
      complementarySkills: this.findComplementarySkills(userProfile, partnerProfile),
      sharedPassions: this.findSharedPassions(userProfile, partnerProfile),
      energySynergy: this.calculateEnergySynergy(userProfile.astroData, partnerProfile.astroData),
      communicationStyle: this.analyzeCommunicationSynergy(userProfile, partnerProfile),
      growthOpportunities: this.identifyGrowthOpportunities(userProfile, partnerProfile),
      potentialBlockers: this.identifyPotentialBlockers(userProfile, partnerProfile)
    }
  }

  private async generateAIProjects(
    synergy: SynergyAnalysis, 
    count: number
  ): Promise<CollaborativeProject[]> {
    const prompt = `
En tant que coach de collaboration expert, génère des idées de projets basées sur cette analyse de synergie :

ANALYSE DE SYNERGIE:
COMPLÉMENTARITÉ DES COMPÉTENCES:
- Personne A excelle en: ${synergy.complementarySkills.userA.join(', ')}
- Personne B excelle en: ${synergy.complementarySkills.userB.join(', ')}

PASSIONS COMMUNES:
${synergy.sharedPassions.map(p => `- ${p}`).join('\n')}

SYNERGIE ÉNERGÉTIQUE:
- Type: ${synergy.energySynergy.type}
- Potentiel: ${synergy.energySynergy.potential}/10
- Description: ${synergy.energySynergy.description}

COMPATIBILITÉ COMMUNICATION:
- Score: ${synergy.communicationStyle.compatibility}/10
- Style A: ${synergy.communicationStyle.userA}
- Style B: ${synergy.communicationStyle.userB}

OPPORTUNITÉS DE CROISSANCE:
${synergy.growthOpportunities.map(o => `- ${o}`).join('\n')}

Génère ${count} projets collaboratifs concrets avec cette structure pour chaque projet:

{
  "title": "Titre accrocheur et motivant",
  "description": "Description détaillée du projet et de sa valeur",
  "projectType": "sport_community | educational | event_organization | content_creation | social_impact | business_startup",
  "requiredSkills": ["liste", "de", "compétences", "nécessaires"],
  "complementaryRoles": ["rôle pour Personne A", "rôle complémentaire pour Personne B"],
  "estimatedDuration": "2-4 semaines | 1-2 mois | 3-6 mois",
  "difficulty": "débutant | intermédiaire | avancé",
  "potentialImpact": 8.5,
  "resourcesNeeded": ["ressource 1", "ressource 2"],
  "successMetrics": ["métrique 1", "métrique 2", "métrique 3"],
  "suggestedTimeline": [
    {"phase": "Phase 1", "duration": "1 semaine", "tasks": ["tâche 1", "tâche 2"]},
    {"phase": "Phase 2", "duration": "2 semaines", "tasks": ["tâche 3", "tâche 4"]}
  ],
  "potentialChallenges": ["challenge 1", "challenge 2"],
  "mitigationStrategies": ["stratégie 1", "stratégie 2"]
}

Les projets doivent être réalistes, alignés avec leurs passions communes, et tirer parti de leur complémentarité.
`

    const response = await this.openAI.generateStructuredResponse<{ projects: CollaborativeProject[] }>(prompt)
    return response.projects
  }

  private findComplementarySkills(profileA: CompleteUserProfile, profileB: CompleteUserProfile) {
    const skillsA = profileA.profile?.skills || []
    const skillsB = profileB.profile?.skills || []
    
    return {
      userA: skillsA.filter(skill => !skillsB.includes(skill)),
      userB: skillsB.filter(skill => !skillsA.includes(skill)),
      combined: [...new Set([...skillsA, ...skillsB])]
    }
  }

  private findSharedPassions(profileA: CompleteUserProfile, profileB: CompleteUserProfile): string[] {
    const passionsA = profileA.profile?.interests || []
    const passionsB = profileB.profile?.interests || []
    
    return passionsA.filter(passion => passionsB.includes(passion))
  }

  private calculateEnergySynergy(astroA: AstroData, astroB: AstroData) {
    const elementSynergy = this.getElementSynergy(astroA.dominantElement, astroB.dominantElement)
    const modeSynergy = this.getModeSynergy(astroA.dominantMode, astroB.dominantMode)
    
    const potential = (elementSynergy.score + modeSynergy.score) / 2
    
    return {
      type: `${elementSynergy.type}-${modeSynergy.type}`,
      potential,
      description: `Synergie ${elementSynergy.description} avec une dynamique ${modeSynergy.description}`
    }
  }

  private async filterByFeasibility(
    projects: CollaborativeProject[], 
    userId: string, 
    partnerId: string
  ): Promise<CollaborativeProject[]> {
    const [userResources, partnerResources] = await Promise.all([
      this.getUserResources(userId),
      this.getUserResources(partnerId)
    ])

    return projects.filter(project => 
      this.isProjectFeasible(project, userResources, partnerResources)
    )
  }

  private isProjectFeasible(
    project: CollaborativeProject, 
    resourcesA: UserResources, 
    resourcesB: UserResources
  ): boolean {
    const availableResources = [...resourcesA.available, ...resourcesB.available]
    const hasRequiredResources = project.resourcesNeeded.every(resource =>
      availableResources.includes(resource)
    )

    const hasRequiredSkills = project.requiredSkills.every(skill =>
      resourcesA.skills.includes(skill) || resourcesB.skills.includes(skill)
    )

    return hasRequiredResources && hasRequiredSkills
  }

  async saveProjectInterest(
    projectId: string, 
    userId: string, 
    interestLevel: number, 
    feedback?: string
  ): Promise<void> {
    await this.db.supabase
      .from('project_interests')
      .upsert({
        project_id: projectId,
        user_id: userId,
        interest_level: interestLevel,
        feedback: feedback,
        updated_at: new Date().toISOString()
      })
  }

  async getMutualProjects(userId: string, partnerId: string): Promise<MutualProject[]> {
    const { data, error } = await this.db.supabase
      .from('mutual_projects')
      .select('*')
      .or(`and(user_a_id.eq.${userId},user_b_id.eq.${partnerId}),and(user_a_id.eq.${partnerId},user_b_id.eq.${userId})`)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }
}
