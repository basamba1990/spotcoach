# microservices/matching-engine/vector-service.ts
import { SimilarityMetrics } from '../../utils/similarity-metrics'
import { RedisCache } from '../../utils/redis-cache'

export class VectorService {
  private cache: RedisCache

  constructor() {
    this.cache = new RedisCache()
  }

  async findSimilarVectors(
    queryVector: number[],
    candidateVectors: Array<{ id: string; vector: number[] }>,
    topK: number = 10,
    similarityThreshold: number = 0.5
  ): Promise<Array<{ id: string; similarity: number }>> {
    
    const similarities = candidateVectors.map(candidate => ({
      id: candidate.id,
      similarity: SimilarityMetrics.cosineSimilarity(queryVector, candidate.vector)
    }))

    // Filtrer par seuil et trier
    const filtered = similarities
      .filter(item => item.similarity >= similarityThreshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK)

    return filtered
  }

  async clusterUsers(embeddings: Array<{ userId: string; embedding: number[] }>, k: number = 8) {
    // Implémentation simplifiée du clustering K-means
    const clusters = this.kMeansClustering(embeddings, k)
    
    // Analyser les clusters
    const clusterAnalysis = this.analyzeClusters(clusters)
    
    return clusterAnalysis
  }

  private kMeansClustering(
    embeddings: Array<{ userId: string; embedding: number[] }>,
    k: number,
    maxIterations: number = 100
  ) {
    // Initialisation aléatoire des centroïdes
    let centroids = this.initializeCentroids(embeddings, k)
    let clusters: Array<Array<{ userId: string; embedding: number[] }>> = []
    let iterations = 0

    while (iterations < maxIterations) {
      // Assigner chaque point au centroïde le plus proche
      clusters = Array(k).fill(null).map(() => [])
      
      for (const point of embeddings) {
        const distances = centroids.map(centroid => 
          SimilarityMetrics.euclideanDistance(point.embedding, centroid)
        )
        const closestCentroidIndex = distances.indexOf(Math.min(...distances))
        clusters[closestCentroidIndex].push(point)
      }

      // Recalculer les centroïdes
      const newCentroids = clusters.map(cluster => {
        if (cluster.length === 0) return centroids[0] // Fallback
        return this.calculateCentroid(cluster.map(p => p.embedding))
      })

      // Vérifier la convergence
      const hasConverged = this.checkConvergence(centroids, newCentroids)
      if (hasConverged) break

      centroids = newCentroids
      iterations++
    }

    return {
      clusters,
      centroids,
      iterations
    }
  }

  private initializeCentroids(embeddings: Array<{ userId: string; embedding: number[] }>, k: number): number[][] {
    // Sélectionner k points aléatoires comme centroïdes initiaux
    const shuffled = [...embeddings].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, k).map(point => point.embedding)
  }

  private calculateCentroid(vectors: number[][]): number[] {
    const dimensions = vectors[0].length
    const centroid = Array(dimensions).fill(0)

    for (const vector of vectors) {
      for (let i = 0; i < dimensions; i++) {
        centroid[i] += vector[i]
      }
    }

    return centroid.map(value => value / vectors.length)
  }

  private checkConvergence(oldCentroids: number[][], newCentroids: number[][], threshold: number = 0.001): boolean {
    for (let i = 0; i < oldCentroids.length; i++) {
      const distance = SimilarityMetrics.euclideanDistance(oldCentroids[i], newCentroids[i])
      if (distance > threshold) return false
    }
    return true
  }

  private analyzeClusters(clusteringResult: any) {
    const analysis = clusteringResult.clusters.map((cluster: any[], index: number) => {
      if (cluster.length === 0) {
        return {
          clusterId: index,
          size: 0,
          representativeUsers: [],
          commonCharacteristics: []
        }
      }

      // Trouver les utilisateurs les plus centraux
      const representativeUsers = this.findRepresentativeUsers(cluster, clusteringResult.centroids[index])
      
      // Analyser les caractéristiques communes
      const commonCharacteristics = this.analyzeCommonCharacteristics(cluster)

      return {
        clusterId: index,
        size: cluster.length,
        representativeUsers: representativeUsers.slice(0, 3),
        commonCharacteristics,
        centroid: clusteringResult.centroids[index]
      }
    })

    return analysis.filter((cluster: any) => cluster.size > 0)
  }

  private findRepresentativeUsers(cluster: Array<{ userId: string; embedding: number[] }>, centroid: number[]) {
    return cluster
      .map(point => ({
        userId: point.userId,
        distance: SimilarityMetrics.euclideanDistance(point.embedding, centroid)
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5)
      .map(item => item.userId)
  }

  private analyzeCommonCharacteristics(cluster: Array<{ userId: string; embedding: number[] }>) {
    // Cette analyse nécessiterait des données utilisateur supplémentaires
    // Pour l'instant, retourner des caractéristiques génériques
    return [
      'Profil énergétique similaire',
      'Centres d\'intérêt communs',
      'Style de communication compatible'
    ]
  }
}
