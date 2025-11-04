// src/controllers/AdminMatchingController.ts
export class AdminMatchingController {
  async getMatchingAnalytics(req: Request, res: Response) {
    const analytics = {
      totalUsers: await this.getTotalUsers(),
      usersWithEmbeddings: await this.getUsersWithEmbeddings(),
      averageMatchesPerUser: await this.getAverageMatches(),
      matchSuccessRate: await this.getMatchSuccessRate(),
      clusterDistribution: await this.getClusterDistribution(),
      performanceMetrics: await this.getPerformanceMetrics()
    };

    res.json(analytics);
  }

  async getMatchQualityReport(req: Request, res: Response) {
    const report = await this.generateQualityReport();
    res.json(report);
  }
}
