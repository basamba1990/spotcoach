-- infrastructure/scripts/init-database.sql
-- Extension pour les vecteurs
CREATE EXTENSION IF NOT EXISTS vector;

-- Table des utilisateurs (gérée par Supabase Auth)
-- Table des profils utilisateurs
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    bio TEXT,
    avatar_url TEXT,
    birth_date DATE,
    birth_time TIME,
    birth_place TEXT,
    latitude DECIMAL(10, 6),
    longitude DECIMAL(10, 6),
    timezone TEXT,
    sports TEXT[],
    interests TEXT[],
    skills TEXT[],
    goals JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des calculs astrologiques
CREATE TABLE astro_calculations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    planetary_positions JSONB NOT NULL,
    houses_cusps JSONB NOT NULL,
    aspects JSONB NOT NULL,
    dominant_elements JSONB NOT NULL,
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Table des embeddings utilisateurs
CREATE TABLE user_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
    embedding vector(3072),
    profile_type TEXT NOT NULL DEFAULT 'composite',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des matches
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_a_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    user_b_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    similarity_score DECIMAL(3,2) NOT NULL,
    match_type TEXT NOT NULL,
    complementary_aspects JSONB NOT NULL,
    explanation TEXT,
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_a_id, user_b_id)
);

-- Table des projets collaboratifs
CREATE TABLE collaborative_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_a_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    user_b_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    project_data JSONB NOT NULL,
    match_score DECIMAL(3,2) NOT NULL,
    feasibility_score DECIMAL(3,2) NOT NULL,
    interest_level_a INTEGER DEFAULT 0,
    interest_level_b INTEGER DEFAULT 0,
    status TEXT DEFAULT 'suggested',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX idx_user_embeddings_vector ON user_embeddings USING hnsw (embedding vector_cosine_ops);
CREATE INDEX idx_matches_user_a ON matches(user_a_id);
CREATE INDEX idx_matches_user_b ON matches(user_b_id);
CREATE INDEX idx_projects_users ON collaborative_projects(user_a_id, user_b_id);
CREATE INDEX idx_projects_status ON collaborative_projects(status);

-- Fonction pour recherche vectorielle
CREATE OR REPLACE FUNCTION find_similar_users(
    query_embedding vector(3072),
    similarity_threshold float DEFAULT 0.3,
    max_results int DEFAULT 20
)
RETURNS TABLE (
    user_id uuid,
    similarity float,
    metadata jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ue.user_id,
        1 - (ue.embedding <=> query_embedding) as similarity,
        ue.metadata
    FROM user_embeddings ue
    WHERE 1 - (ue.embedding <=> query_embedding) > similarity_threshold
    ORDER BY ue.embedding <=> query_embedding
    LIMIT max_results;
END;
$$;
