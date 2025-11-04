-- migrations/003_vector_matching.sql
-- Activation extension pg_vector
CREATE EXTENSION IF NOT EXISTS vector;

-- Table des embeddings
CREATE TABLE user_embeddings (...);

-- Index pour performances
CREATE INDEX CONCURRENTLY idx_user_embeddings_hnsw ON user_embeddings USING hnsw (embedding vector_cosine_ops);

-- Fonctions de similarité
CREATE OR REPLACE FUNCTION find_similar_users(
  query_embedding vector(3072),
  similarity_threshold float DEFAULT 0.7,
  max_results int DEFAULT 10
)
RETURNS TABLE (
  user_id uuid,
  similarity float,
  metadata jsonb
)
LANGUAGE sql STABLE
AS $$
  SELECT 
    user_id,
    1 - (embedding <=> query_embedding) as similarity,
    metadata
  FROM user_embeddings
  WHERE 1 - (embedding <=> query_embedding) > similarity_threshold
  ORDER BY embedding <=> query_embedding
  LIMIT max_results;
$$;
