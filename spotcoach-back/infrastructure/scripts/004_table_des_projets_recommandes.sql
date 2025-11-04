--infrastructure/scripts/004_table_des_projets_recommandes.sql
--Table des projets recommandés
CREATE TABLE collaborative_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_a_id UUID REFERENCES auth.users(id),
    user_b_id UUID REFERENCES auth.users(id),
    project_data JSONB NOT NULL,
    match_score FLOAT NOT NULL,
    feasibility_score FLOAT NOT NULL,
    interest_level_a INTEGER DEFAULT 0, -- 0-5 étoiles
    interest_level_b INTEGER DEFAULT 0,
    status project_status DEFAULT 'suggested',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des modèles de projets
CREATE TABLE project_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_type project_type NOT NULL,
    title_template TEXT NOT NULL,
    description_template TEXT NOT NULL,
    required_skills TEXT[] NOT NULL,
    target_audience TEXT[] NOT NULL,
    success_metrics JSONB NOT NULL,
    difficulty difficulty_level NOT NULL,
    average_duration TEXT NOT NULL,
    tags TEXT[] NOT NULL
);

-- Types
CREATE TYPE project_type AS ENUM (
    'sport_community',
    'educational',
    'event_organization',
    'content_creation',
    'social_impact',
    'business_startup'
);

CREATE TYPE project_status AS ENUM (
    'suggested',
    'accepted',
    'active',
    'completed',
    'rejected'
);
