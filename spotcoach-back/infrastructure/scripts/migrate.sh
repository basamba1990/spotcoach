#!/bin/bash
# infrastructure/scripts/migrate.sh

set -e

echo "🔧 Application des migrations de base de données..."

# Attendre que PostgreSQL soit prêt
echo "⏳ Attente de PostgreSQL..."
until pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER; do
  echo "📡 En attente de PostgreSQL sur $DB_HOST:$DB_PORT..."
  sleep 2
done

echo "✅ PostgreSQL est prêt!"

# Vérifier si la base de données existe
if ! psql -h $DB_HOST -p $DB_PORT -U $DB_USER -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
  echo "📦 Création de la base de données $DB_NAME..."
  createdb -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME
fi

echo "🗃️ Application des migrations..."

# Appliquer les migrations dans l'ordre
for migration_file in /app/migrations/*.sql; do
  if [ -f "$migration_file" ]; then
    echo "📝 Application de $(basename $migration_file)"
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$migration_file"
  fi
done

# Vérifier l'extension pg_vector
echo "🔍 Vérification de l'extension pg_vector..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
CREATE EXTENSION IF NOT EXISTS vector;
SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';
"

# Créer les fonctions personnalisées
echo "⚙️ Création des fonctions personnalisées..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "/app/functions/vector_functions.sql"

echo "✅ Migrations appliquées avec succès!"
echo "📊 Base de données prête pour SpotBulle"
