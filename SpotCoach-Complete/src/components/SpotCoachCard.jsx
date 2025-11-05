import { useState } from 'react';

export default function SpotCoachCard({ user, profile, onProfileGenerated }) {
  const [showProfile, setShowProfile] = useState(false);
  const [loading, setLoading] = useState(false);

  const generateProfile = async () => {
    if (!user) {
      alert('Veuillez vous connecter pour générer un profil SpotCoach');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/spotcoach/profile-symbolique', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: profile?.full_name || 'Utilisateur',
          date: '1990-01-01', // À remplacer par un formulaire de date de naissance
          time: '12:00', 
          lat: 48.8566,
          lon: 2.3522,
          userId: user?.id,
          userPassions: profile?.passions || []
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la génération du profil');
      }

      onProfileGenerated(data);
      setShowProfile(true);
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la génération du profil: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-6 text-white shadow-2xl">
      <div className="flex items-center gap-4 mb-4">
        <div className="text-3xl">🌟</div>
        <div>
          <h3 className="text-xl font-bold">SpotCoach</h3>
          <p className="text-purple-100 text-sm">Ton assistant personnel</p>
        </div>
      </div>

      {!showProfile ? (
        <div className="space-y-4">
          <p className="text-purple-100">
            Découvre ton profil symbolique et crée un projet qui a du sens
          </p>
          <button
            onClick={generateProfile}
            disabled={loading}
            className="w-full bg-white/20 hover:bg-white/30 text-white font-semibold py-3 px-4 rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Génération...
              </span>
            ) : (
              '🎯 Commencer l\'aventure'
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-white/10 rounded-lg">
            <h4 className="font-semibold mb-2">Ton Archétype: Héros</h4>
            <p className="text-sm text-purple-100">
              Tu as un talent naturel pour inspirer les autres et prendre des initiatives.
            </p>
          </div>
          
          <button
            onClick={() => window.location.href = '/spotcoach'}
            className="w-full bg-white/20 hover:bg-white/30 text-white font-semibold py-3 px-4 rounded-lg transition-all"
          >
            📊 Voir mon profil complet
          </button>
        </div>
      )}
    </div>
  );
}
