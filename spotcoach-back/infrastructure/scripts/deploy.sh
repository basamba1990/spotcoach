#!/bin/bash
# infrastructure/scripts/deploy.sh

set -e

echo "🚀 Déploiement spotcoach..."

# Variables
DOCKER_COMPOSE_FILE="docker-compose.yml"
ENV_FILE=".env"

# Vérification des prérequis
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose n'est pas installé"
    exit 1
fi

# Chargement des variables d'environnement
if [ -f "$ENV_FILE" ]; then
    echo "📁 Chargement des variables d'environnement..."
    export $(cat $ENV_FILE | grep -v '^#' | xargs)
else
    echo "❌ Fichier .env manquant"
    exit 1
fi

# Construction des images
echo "🔨 Construction des images Docker..."
docker-compose -f $DOCKER_COMPOSE_FILE build

# Arrêt des services existants
echo "🛑 Arrêt des services existants..."
docker-compose -f $DOCKER_COMPOSE_FILE down

# Démarrage des services
echo "🚀 Démarrage des services..."
docker-compose -f $DOCKER_COMPOSE_FILE up -d

# Attente que les services soient prêts
echo "⏳ Attente du démarrage des services..."
sleep 30

# Vérification du statut
echo "🔍 Vérification du statut des services..."
docker-compose -f $DOCKER_COMPOSE_FILE ps

# Exécution des migrations
echo "📦 Exécution des migrations..."
docker-compose -f $DOCKER_COMPOSE_FILE exec api npm run migrate

echo "✅ Déploiement terminé avec succès!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 API: http://localhost:3001"
echo "📊 Base de données: localhost:5432"
