import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function SpotCoachProject() {
  const router = useRouter();
  const [projectData, setProjectData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (router.query.data) {
      try {
        const data = JSON.parse(decodeURIComponent(router.query.data));
        setProjectData(data);
      } catch (error) {
        console.error('Erreur parsing project data:', error);
      } finally {
        setLoading(false);
      }
    }
  }, [router.query.data]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-emerald-900 to-teal-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Chargement de votre projet...</p>
        </div>
      </div>
    );
  }

  if (!projectData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-emerald-900 to-teal-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-3xl font-bold mb-4">Projet non trouvé</h1>
          <button 
            onClick={() => router.push('/spotcoach')}
            className="bg-white text-green-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-all"
          >
            Retour à SpotCoach
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-emerald-900 to-teal-900 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-4">
            🚀 Ton Projet SpotBulle
          </h1>
          <p className="text-xl text-emerald-200">
            Inspire-toi de ton essence pour créer l'extraordinaire
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 text-white">
          {/* En-tête du projet */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 bg-white/10 rounded-full px-6 py-3 border border-white/20 mb-4">
              <div 
                className="w-4 h-4 rounded-full animate-pulse"
                style={{ backgroundColor: projectData.couleur.toLowerCase() }}
              ></div>
              <span className="text-lg font-semibold">{projectData.archétype}</span>
            </div>
            <h2 className="text-3xl font-bold mb-4">Projet Créé avec SpotCoach</h2>
          </div>

          {/* Contenu du projet */}
          <div className="prose prose-invert max-w-none">
            <div className="whitespace-pre-wrap text-gray-200 text-lg leading-relaxed">
              {projectData.project}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => router.push('/spotcoach')}
                className="bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-6 rounded-xl transition-all border border-white/20"
              >
                🔄 Créer un nouveau projet
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-xl transition-all transform hover:scale-105"
              >
                📊 Voir mon dashboard
              </button>
            </div>
          </div>
        </div>

        {/* Section inspiration */}
        <div className="mt-8 bg-white/5 rounded-2xl p-6 border border-white/10">
          <h3 className="text-xl font-semibold text-white mb-4 text-center">
            💡 Prochaines étapes
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-white/5 rounded-xl">
              <div className="text-2xl mb-2">🎯</div>
              <h4 className="font-semibold text-white mb-2">Définis ton objectif</h4>
              <p className="text-emerald-200 text-sm">Prends le temps de préciser ton projet</p>
            </div>
            <div className="p-4 bg-white/5 rounded-xl">
              <div className="text-2xl mb-2">👥</div>
              <h4 className="font-semibold text-white mb-2">Trouve des alliés</h4>
              <p className="text-emerald-200 text-sm">Connecte-toi avec des personnes complémentaires</p>
            </div>
            <div className="p-4 bg-white/5 rounded-xl">
              <div className="text-2xl mb-2">🚀</div>
              <h4 className="font-semibold text-white mb-2">Passe à l'action</h4>
              <p className="text-emerald-200 text-sm">Commence petit et grandis avec ton projet</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
