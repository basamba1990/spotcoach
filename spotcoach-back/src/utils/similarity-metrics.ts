// src/utils/similarity-metrics.ts
export class SimilarityMetrics {
  static cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length')
    }

    let dotProduct = 0
    let normA = 0
    let normB = 0

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i]
      normA += a[i] * a[i]
      normB += b[i] * b[i]
    }

    if (normA === 0 || normB === 0) return 0
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
  }

  static euclideanDistance(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length')
    }

    let sum = 0
    for (let i = 0; i < a.length; i++) {
      sum += Math.pow(a[i] - b[i], 2)
    }

    return Math.sqrt(sum)
  }

  static jaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
    const intersection = new Set([...setA].filter(x => setB.has(x)))
    const union = new Set([...setA, ...setB])
    
    return union.size === 0 ? 0 : intersection.size / union.size
  }

  static pearsonCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length) {
      throw new Error('Arrays must have the same length')
    }

    const n = x.length
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0

    for (let i = 0; i < n; i++) {
      sumX += x[i]
      sumY += y[i]
      sumXY += x[i] * y[i]
      sumX2 += x[i] * x[i]
      sumY2 += y[i] * y[i]
    }

    const numerator = n * sumXY - sumX * sumY
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))

    return denominator === 0 ? 0 : numerator / denominator
  }

  static calculateCompositeSimilarity(
    vectorSimilarity: number,
    categoricalSimilarity: number,
    numericalSimilarity: number,
    weights = { vector: 0.5, categorical: 0.3, numerical: 0.2 }
  ): number {
    return (
      vectorSimilarity * weights.vector +
      categoricalSimilarity * weights.categorical +
      numericalSimilarity * weights.numerical
    )
  }
}
