// microservices/matching-engine/clustering-service.ts
export class ClusteringService {
  private vectorService: VectorService

  constructor() {
    this.vectorService = new VectorService()
  }

  async performUserClustering(): Promise<ClusterAnalysis> {
    // Récupérer tous les embeddings utilisateur
    const allEmbeddings = await this.getAllUserEmbeddings()
    
    if (allEmbeddings.length < 10) {
      throw new Error('Not enough users for clustering')
    }

    // Déterminer le nombre optimal de clusters
    const optimalK = await this.findOptimalK(allEmbeddings)
    
    // Effectuer le clustering
    const clusteringResult = await this.vectorService.clusterUsers(allEmbeddings, optimalK)
    
    // Enrichir avec des métadonnées utilisateur
    const enrichedClusters = await this.enrichClustersWithUserData(clusteringResult)
    
    // Sauvegarder les résultats
    await this.saveClusterAnalysis(enrichedClusters)
    
    return enrichedClusters
  }

  private async getAllUserEmbeddings() {
    // Implémentation pour récupérer tous les embeddings
    // Cette méthode devrait interroger la base de données
    return [] // Placeholder
  }

  private async findOptimalK(embeddings: any[], maxK: number = 10): Promise<number> {
    // Utiliser la méthode du coude pour trouver le k optimal
    const distortions: number[] = []
    
    for (let k = 2; k <= Math.min(maxK, Math.floor(embeddings.length / 2)); k++) {
      const clustering = await this.vectorService.clusterUsers(embeddings, k)
      const distortion = this.calculateDistortion(clustering)
      distortions.push(distortion)
    }

    // Trouver le "coude" dans la courbe de distortion
    return this.findElbowPoint(distortions) + 2 // +2 car on commence à k=2
  }

  private calculateDistortion(clustering: any): number {
    // Calculer la distortion totale (somme des distances au carré)
    let totalDistortion = 0
    
    for (let i = 0; i < clustering.clusters.length; i++) {
      const cluster = clustering.clusters[i]
      const centroid = clustering.centroids[i]
      
      for (const point of cluster) {
        const distance = SimilarityMetrics.euclideanDistance(point.embedding, centroid)
        totalDistortion += distance * distance
      }
    }
    
    return totalDistortion
  }

  private findElbowPoint(distortions: number[]): number {
    // Trouver le point où la réduction de distortion ralentit significativement
    const differences = []
    
    for (let i = 1; i < distortions.length; i++) {
      differences.push(distortions[i - 1] - distortions[i])
    }

    // Trouver le plus grand écart dans les différences
    let maxDropIndex = 0
    let maxDrop = 0

    for (let i = 0; i < differences.length - 1; i++) {
      const drop = differences[i] - differences[i + 1]
      if (drop > maxDrop) {
        maxDrop = drop
        maxDropIndex = i
      }
    }

    return maxDropIndex
  }

  private async enrichClustersWithUserData(clusteringResult: any) {
    const enrichedClusters = await Promise.all(
      clusteringResult.map(async (cluster: any) => {
        // Récupérer les profils utilisateur pour ce cluster
        const userProfiles = await this.getUserProfiles(cluster.representativeUsers)
        
        return {
          ...cluster,
          userProfiles,
          dominantTraits: this.extractDominantTraits(userProfiles),
          recommendedConnections: this.generateClusterConnections(cluster)
        }
      })
    )

    return enrichedClusters
  }

  private extractDominantTraits(userProfiles: any[]): string[] {
    // Analyser les traits dominants dans le cluster
    const traitCounts: Record<string, number> = {}
    
    for (const profile of userProfiles) {
      const traits = profile.personality?.traits || []
      for (const trait of traits) {
        traitCounts[trait] = (traitCounts[trait] || 0) + 1
      }
    }

    // Retourner les 5 traits les plus fréquents
    return Object.entries(traitCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([trait]) => trait)
  }

  private generateClusterConnections(cluster: any) {
    // Générer des recommandations de connexions intra-cluster
    const connections = []
    
    for (let i = 0; i < Math.min(3, cluster.representativeUsers.length); i++) {
      for (let j = i + 1; j < Math.min(6, cluster.representativeUsers.length); j++) {
        connections.push({
          userA: cluster.representativeUsers[i],
          userB: cluster.representativeUsers[j],
          reason: 'Profil similaire dans le même cluster',
          strength: 'high'
        })
      }
    }

    return connections
  }

  private async saveClusterAnalysis(clusters: any[]) {
    // Sauvegarder l'analyse de clustering
    for (const cluster of clusters) {
      await this.db.supabase
        .from('user_clusters')
        .upsert({
          cluster_id: cluster.clusterId,
          cluster_data: cluster,
          size: cluster.size,
          updated_at: new Date().toISOString()
        })
    }
  }

  async findSimilarClusters(userId: string): Promise<ClusterMatch[]> {
    const userCluster = await this.getUserCluster(userId)
    if (!userCluster) return []

    const allClusters = await this.getAllClusters()
    const similarClusters = allClusters
      .filter(cluster => cluster.clusterId !== userCluster.clusterId)
      .map(cluster => ({
        clusterId: cluster.clusterId,
        similarity: this.calculateClusterSimilarity(userCluster, cluster),
        representativeUsers: cluster.representativeUsers,
        commonCharacteristics: cluster.dominantTraits
      }))
      .filter(match => match.similarity > 0.6)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 3)

    return similarClusters
  }

  private calculateClusterSimilarity(clusterA: any, clusterB: any): number {
    // Calculer la similarité entre clusters basée sur leurs centroïdes
    return SimilarityMetrics.cosineSimilarity(clusterA.centroid, clusterB.centroid)
  }
}
