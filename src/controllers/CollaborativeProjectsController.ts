// src/controllers/CollaborativeProjectsController.ts
export class CollaborativeProjectsController {
  private projectService: ProjectRecommendationService;

  async getProjectsForMatch(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const { partnerId } = req.params;

      const projects = await this.projectService.generateCollaborativeProjects(
        userId, 
        partnerId
      );

      res.json({
        success: true,
        projects,
        generatedAt: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ error: 'Erreur génération projets' });
    }
  }

  async saveProjectInterest(req: Request, res: Response) {
    try {
      const { projectId, interestLevel, feedback } = req.body;
      const userId = req.user.id;

      await this.projectService.saveUserInterest(
        projectId, 
        userId, 
        interestLevel, 
        feedback
      );

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Erreur sauvegarde intérêt' });
    }
  }
}
