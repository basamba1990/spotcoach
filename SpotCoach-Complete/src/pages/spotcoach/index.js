import { useState } from 'react';
import { useUser } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/router';
import SymbolicProfile from '../../components/SymbolicProfile';

export default function SpotCoachPage() {
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    lat: '',
    lon: '',
    name: ''
  });
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const user = useUser();
  const router = useRouter();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/spotcoach/profile-symbolique', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          userId: user?.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la génération du profil');
      }

      setProfile(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateProject = async () => {
    if (!profile) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/spotcoach/spotcoach-project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.id,
          name: formData.name,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la génération du projet');
      }

      // Redirection vers la page projet
      router.push(`/spotcoach/project?data=${encodeURIComponent(JSON.stringify(data))}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-4">
            🌟 SpotCoach
          </h1>
          <p className="text-xl text-purple-200">
            Découvre ton profil symbolique et crée ton projet
          </p>
        </div>

        {!profile ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Formulaire */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h2 className="text-2xl font-semibold text-white mb-6">
                📝 Tes informations
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-purple-200 mb-2">
                    Prénom
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Ton prénom"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-purple-200 mb-2">
                    Date de naissance
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                    className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-purple-200 mb-2">
                    Heure de naissance
                  </label>
                  <input
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleChange}
                    required
                    className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-purple-200 mb-2">
                      Latitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      name="lat"
                      value={formData.lat}
                      onChange={handleChange}
                      required
                      className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="48.8566"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-purple-200 mb-2">
                      Longitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      name="lon"
                      value={formData.lon}
                      onChange={handleChange}
                      required
                      className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="2.3522"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Génération du profil...
                    </span>
                  ) : (
                    '✨ Générer mon profil symbolique'
                  )}
                </button>
              </form>

              {error && (
                <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
                  <p className="text-red-200">{error}</p>
                </div>
              )}
            </div>

            {/* Informations */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h2 className="text-2xl font-semibold text-white mb-6">
                💫 Comment ça marche ?
              </h2>
              
              <div className="space-y-4 text-purple-200">
                <div className="flex items-start gap-4">
                  <div className="text-2xl">🔮</div>
                  <div>
                    <h3 className="font-semibold text-white">Profil Symbolique Personnalisé</h3>
                    <p className="text-sm">Basé sur tes données de naissance et Swiss Ephemeris</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="text-2xl">🎭</div>
                  <div>
                    <h3 className="font-semibold text-white">Archétypes & Couleurs</h3>
                    <p className="text-sm">Découvre ton archétype dominant et ta couleur énergétique</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="text-2xl">🤝</div>
                  <div>
                    <h3 className="font-semibold text-white">Synergies Communautaires</h3>
                    <p className="text-sm">Trouve des personnes complémentaires dans SpotBulle</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="text-2xl">🚀</div>
                  <div>
                    <h3 className="font-semibold text-white">Projet Personnalisé</h3>
                    <p className="text-sm">Crée un projet aligné avec ton essence</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <SymbolicProfile 
            profile={profile}
            onGenerateProject={generateProject}
          />
        )}
      </div>
    </div>
  );
}
