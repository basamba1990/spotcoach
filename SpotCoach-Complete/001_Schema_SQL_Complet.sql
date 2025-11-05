-- =============================================
-- TABLE: profiles_symboliques
-- Stocke les profils symboliques générés
-- =============================================
CREATE TABLE IF NOT EXISTS profiles_symboliques (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Données de naissance
    name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    lat DECIMAL(10, 6) NOT NULL,
    lon DECIMAL(10, 6) NOT NULL,
    
    -- Positions planétaires calculées
    soleil DECIMAL(10, 6) NOT NULL,
    lune DECIMAL(10, 6) NOT NULL,
    ascendant DECIMAL(10, 6) NOT NULL,
    mercure DECIMAL(10, 6),
    venus DECIMAL(10, 6),
    mars DECIMAL(10, 6),
    jupiter DECIMAL(10, 6),
    saturne DECIMAL(10, 6),
    
    -- Profil symbolique
    profile_text TEXT NOT NULL,
    phrase_synchronie TEXT NOT NULL,
    archétype VARCHAR(100) NOT NULL,
    couleur_dominante VARCHAR(50) NOT NULL,
    élément VARCHAR(50) NOT NULL,
    
    -- Signes
    signe_soleil VARCHAR(50) NOT NULL,
    signe_lune VARCHAR(50) NOT NULL,
    signe_ascendant VARCHAR(50) NOT NULL,
    
    -- Aspects planétaires
    aspects JSONB DEFAULT '[]',
    
    -- Passions utilisateur
    passions TEXT[] DEFAULT '{}',
    
    -- Métadonnées
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Index pour performances
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Index pour recherches rapides
CREATE INDEX idx_profiles_symboliques_user_id ON profiles_symboliques(user_id);
CREATE INDEX idx_profiles_symboliques_created_at ON profiles_symboliques(created_at DESC);
CREATE INDEX idx_profiles_symboliques_archetype ON profiles_symboliques(archétype);
CREATE INDEX idx_profiles_symboliques_element ON profiles_symboliques(élément);

-- =============================================
-- TABLE: spotcoach_projects
-- Stocke les projets générés par SpotCoach
-- =============================================
CREATE TABLE IF NOT EXISTS spotcoach_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    profile_symbolique_id UUID REFERENCES profiles_symboliques(id) ON DELETE CASCADE,
    
    -- Données du projet
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    domain VARCHAR(200) NOT NULL, -- écologie, éducation, santé, etc.
    objective TEXT NOT NULL,
    motivation_phrase TEXT NOT NULL,
    
    -- État du projet
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'archived')),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    
    -- Métadonnées
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Index
    CONSTRAINT fk_user_project FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT fk_profile_symbolique FOREIGN KEY (profile_symbolique_id) REFERENCES profiles_symboliques(id) ON DELETE SET NULL
);

CREATE INDEX idx_spotcoach_projects_user_id ON spotcoach_projects(user_id);
CREATE INDEX idx_spotcoach_projects_status ON spotcoach_projects(status);
CREATE INDEX idx_spotcoach_projects_created_at ON spotcoach_projects(created_at DESC);

-- =============================================
-- TABLE: compatibilities
-- Stocke les calculs de compatibilité entre utilisateurs
-- =============================================
CREATE TABLE IF NOT EXISTS compatibilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    profile1_id UUID NOT NULL REFERENCES profiles_symboliques(id) ON DELETE CASCADE,
    profile2_id UUID NOT NULL REFERENCES profiles_symboliques(id) ON DELETE CASCADE,
    
    -- Scores de compatibilité
    overall_score DECIMAL(3,1) NOT NULL CHECK (overall_score >= 0 AND overall_score <= 10),
    element_score DECIMAL(3,1) NOT NULL CHECK (element_score >= 0 AND element_score <= 10),
    archetype_score DECIMAL(3,1) NOT NULL CHECK (archetype_score >= 0 AND archetype_score <= 10),
    color_score DECIMAL(3,1) NOT NULL CHECK (color_score >= 0 AND color_score <= 10),
    
    -- Type de connexion
    connection_type VARCHAR(100) NOT NULL CHECK (
        connection_type IN (
            'synergie_exceptionnelle',
            'complémentarité_forte', 
            'partenariat_potentiel',
            'rencontre_intéressante'
        )
    ),
    
    -- Raisons de la compatibilité
    compatibility_reasons TEXT[] DEFAULT '{}',
    
    -- Métadonnées
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Contrainte d'unicité
    UNIQUE(user1_id, user2_id),
    
    -- Contraintes de clés étrangères
    CONSTRAINT fk_user1 FOREIGN KEY (user1_id) REFERENCES auth.users(id),
    CONSTRAINT fk_user2 FOREIGN KEY (user2_id) REFERENCES auth.users(id),
    CONSTRAINT fk_profile1 FOREIGN KEY (profile1_id) REFERENCES profiles_symboliques(id),
    CONSTRAINT fk_profile2 FOREIGN KEY (profile2_id) REFERENCES profiles_symboliques(id),
    CONSTRAINT check_different_users CHECK (user1_id != user2_id)
);

CREATE INDEX idx_compatibilities_user1 ON compatibilities(user1_id);
CREATE INDEX idx_compatibilities_user2 ON compatibilities(user2_id);
CREATE INDEX idx_compatibilities_score ON compatibilities(overall_score DESC);
CREATE INDEX idx_compatibilities_connection_type ON compatibilities(connection_type);

-- =============================================
-- TABLE: symbolic_connections
-- Historique des connexions et interactions entre utilisateurs
-- =============================================
CREATE TABLE IF NOT EXISTS symbolic_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    connected_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Type d'interaction
    interaction_type VARCHAR(100) NOT NULL CHECK (
        interaction_type IN (
            'profile_viewed',
            'message_sent', 
            'project_collaboration',
            'compatibility_calculated'
        )
    ),
    
    -- Données de l'interaction
    interaction_data JSONB DEFAULT '{}',
    
    -- Métadonnées
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT fk_user_connection FOREIGN KEY (user_id) REFERENCES auth.users(id),
    CONSTRAINT fk_connected_user FOREIGN KEY (connected_user_id) REFERENCES auth.users(id),
    CONSTRAINT check_different_users_connection CHECK (user_id != connected_user_id)
);

CREATE INDEX idx_symbolic_connections_user ON symbolic_connections(user_id);
CREATE INDEX idx_symbolic_connections_connected_user ON symbolic_connections(connected_user_id);
CREATE INDEX idx_symbolic_connections_type ON symbolic_connections(interaction_type);

-- =============================================
-- TABLE: astro_cache
-- Cache des calculs astronomiques pour optimisation
-- =============================================
CREATE TABLE IF NOT EXISTS astro_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Clé de cache (hash des paramètres d'entrée)
    cache_key VARCHAR(64) UNIQUE NOT NULL,
    
    -- Paramètres d'entrée
    input_params JSONB NOT NULL,
    
    -- Résultats calculés
    calculated_data JSONB NOT NULL,
    
    -- Métadonnées
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
    
    -- Index
    CONSTRAINT unique_cache_key UNIQUE(cache_key)
);

CREATE INDEX idx_astro_cache_key ON astro_cache(cache_key);
CREATE INDEX idx_astro_cache_expires ON astro_cache(expires_at);

-- =============================================
-- FONCTIONS ET TRIGGERS
-- =============================================

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
CREATE TRIGGER update_profiles_symboliques_updated_at 
    BEFORE UPDATE ON profiles_symboliques 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_spotcoach_projects_updated_at 
    BEFORE UPDATE ON spotcoach_projects 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour calculer l'âge à partir de la date de naissance
CREATE OR REPLACE FUNCTION calculate_age(birth_date DATE)
RETURNS INTEGER AS $$
BEGIN
    RETURN EXTRACT(YEAR FROM AGE(NOW(), birth_date));
END;
$$ LANGUAGE plpgsql;

-- Fonction pour nettoyer le cache astro expiré
CREATE OR REPLACE FUNCTION cleanup_expired_astro_cache()
RETURNS VOID AS $$
BEGIN
    DELETE FROM astro_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- VUES UTILES
-- =============================================

-- Vue pour les profils symboliques enrichis
CREATE OR REPLACE VIEW enriched_symbolic_profiles AS
SELECT 
    ps.*,
    u.email,
    p.full_name,
    p.avatar_url,
    p.passions as user_passions,
    calculate_age(ps.date) as age,
    COUNT(DISTINCT sp.id) as project_count,
    COUNT(DISTINCT c.id) as connection_count
FROM profiles_symboliques ps
LEFT JOIN auth.users u ON ps.user_id = u.id
LEFT JOIN profiles p ON ps.user_id = p.id
LEFT JOIN spotcoach_projects sp ON ps.user_id = sp.user_id
LEFT JOIN symbolic_connections c ON ps.user_id = c.user_id
GROUP BY ps.id, u.email, p.full_name, p.avatar_url, p.passions;

-- Vue pour les compatibilités enrichies
CREATE OR REPLACE VIEW enriched_compatibilities AS
SELECT 
    c.*,
    u1.email as user1_email,
    u2.email as user2_email,
    p1.full_name as user1_name,
    p2.full_name as user2_name,
    ps1.archétype as user1_archetype,
    ps2.archétype as user2_archetype,
    ps1.élément as user1_element,
    ps2.élément as user2_element
FROM compatibilities c
LEFT JOIN auth.users u1 ON c.user1_id = u1.id
LEFT JOIN auth.users u2 ON c.user2_id = u2.id
LEFT JOIN profiles p1 ON c.user1_id = p1.id
LEFT JOIN profiles p2 ON c.user2_id = p2.id
LEFT JOIN profiles_symboliques ps1 ON c.profile1_id = ps1.id
LEFT JOIN profiles_symboliques ps2 ON c.profile2_id = ps2.id;

-- =============================================
-- POLITIQUES RLS (Row Level Security)
-- =============================================

-- Activer RLS sur toutes les tables
ALTER TABLE profiles_symboliques ENABLE ROW LEVEL SECURITY;
ALTER TABLE spotcoach_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE compatibilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE symbolic_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE astro_cache ENABLE ROW LEVEL SECURITY;

-- Politiques pour profiles_symboliques
CREATE POLICY "Users can view own symbolic profiles" ON profiles_symboliques
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own symbolic profiles" ON profiles_symboliques
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own symbolic profiles" ON profiles_symboliques
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own symbolic profiles" ON profiles_symboliques
    FOR DELETE USING (auth.uid() = user_id);

-- Politiques pour spotcoach_projects
CREATE POLICY "Users can view own projects" ON spotcoach_projects
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects" ON spotcoach_projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON spotcoach_projects
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON spotcoach_projects
    FOR DELETE USING (auth.uid() = user_id);

-- Politiques pour compatibilities
CREATE POLICY "Users can view compatibilities involving them" ON compatibilities
    FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Politiques pour symbolic_connections
CREATE POLICY "Users can view own connections" ON symbolic_connections
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own connections" ON symbolic_connections
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Politiques pour astro_cache (lecture seule pour tous)
CREATE POLICY "Anyone can read astro cache" ON astro_cache
    FOR SELECT USING (true);

CREATE POLICY "Only service role can modify astro cache" ON astro_cache
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =============================================
-- INDEX SUPPLÉMENTAIRES POUR PERFORMANCES
-- =============================================

-- Index pour les recherches de compatibilité
CREATE INDEX idx_compatibilities_composite ON compatibilities(user1_id, overall_score DESC);
CREATE INDEX idx_compatibilities_double_user ON compatibilities(user1_id, user2_id);

-- Index pour les recherches de profils par élément/archétype
CREATE INDEX idx_profiles_symboliques_composite ON profiles_symboliques(élément, archétype, created_at DESC);

-- Index pour les projets par statut et utilisateur
CREATE INDEX idx_spotcoach_projects_composite ON spotcoach_projects(user_id, status, created_at DESC);

-- Index GIN pour les recherches full-text dans les profils
CREATE INDEX idx_profiles_symboliques_text_search ON profiles_symboliques 
    USING GIN (to_tsvector('french', profile_text || ' ' || phrase_synchronie));

-- Index pour les passions
CREATE INDEX idx_profiles_symboliques_passions ON profiles_symboliques USING GIN (passions);

-- =============================================
-- COMMENTAIRES
-- =============================================

COMMENT ON TABLE profiles_symboliques IS 'Stocke les profils symboliques générés par SpotCoach avec calculs astronomiques';
COMMENT ON TABLE spotcoach_projects IS 'Projets personnalisés générés à partir des profils symboliques';
COMMENT ON TABLE compatibilities IS 'Calculs de compatibilité entre utilisateurs basés sur leurs profils symboliques';
COMMENT ON TABLE symbolic_connections IS 'Historique des interactions et connexions entre utilisateurs';
COMMENT ON TABLE astro_cache IS 'Cache des calculs astronomiques pour optimisation des performances';

COMMENT ON COLUMN profiles_symboliques.soleil IS 'Longitude écliptique du Soleil en degrés';
COMMENT ON COLUMN profiles_symboliques.lune IS 'Longitude écliptique de la Lune en degrés';
COMMENT ON COLUMN profiles_symboliques.ascendant IS 'Longitude écliptique de l''ascendant en degrés';
COMMENT ON COLUMN profiles_symboliques.aspects IS 'Liste des aspects planétaires majeurs au format JSON';
COMMENT ON COLUMN profiles_symboliques.phrase_synchronie IS 'Phrase personnalisée reliant geste technique et essence';

-- =============================================
-- SCRIPT D'INITIALISATION DES DONNÉES DE RÉFÉRENCE
-- =============================================

INSERT INTO astro_cache (cache_key, input_params, calculated_data) VALUES 
(
    'demo_cache_key',
    '{"date": "1990-01-01", "time": "12:00", "lat": 48.8566, "lon": 2.3522}'::jsonb,
    '{"soleil": {"longitude": 280.5, "sign": "Capricorne", "element": "Terre"}}'::jsonb
) ON CONFLICT (cache_key) DO NOTHING;
