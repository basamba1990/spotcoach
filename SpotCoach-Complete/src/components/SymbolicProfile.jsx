import { useState } from 'react';

export default function SymbolicProfile({ profile, onGenerateProject }) {
  const [activeTab, setActiveTab] = useState('identity');

  if (!profile) return null;

  return (
    <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-3xl p-8 text-white shadow-2xl border border-white/10">
      {/* En-tête avec archétype et couleur */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-3 bg-white/10 rounded-full px-6 py-3 border border-white/20">
          <div 
            className="w-4 h-4 rounded-full animate-pulse"
            style={{ backgroundColor: profile.couleur.toLowerCase() }}
          ></div>
          <span className="text-lg font-semibold">{profile.archétype}</span>
          <span className="text-white/60">•</span>
          <span className="text-sm text-white/80">{profile.élément}</span>
        </div>
        
        <div className="mt-4 grid grid-cols-3 gap-4 max-w-md mx-auto">
          <div className="text-center p-3 bg-white/5 rounded-xl">
            <div className="text-xs text-white/60 mb-1">Soleil</div>
            <div className="font-semibold text-sm">{profile.signs.soleil}</div>
          </div>
          <div className="text-center p-3 bg-white/5 rounded-xl">
            <div className="text-xs text-white/60 mb-1">Lune</div>
            <div className="font-semibold text-sm">{profile.signs.lune}</div>
          </div>
          <div className="text-center p-3 bg-white/5 rounded-xl">
            <div className="text-xs text-white/60 mb-1">Ascendant</div>
            <div className="font-semibold text-sm">{profile.signs.ascendant}</div>
          </div>
        </div>
      </div>

      {/* Navigation par onglets */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {[
          { id: 'identity', label: '🦁 Identité', icon: '🦁' },
          { id: 'emotions', label: '🌙 Émotions', icon: '🌙' },
          { id: 'expression', label: '🎭 Expression', icon: '🎭' },
          { id: 'mission', label: '🎯 Mission', icon: '🎯' },
          { id: 'synergy', label: '🌟 Synchronie', icon: '🌟' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id 
                ? 'bg-white/20 text-white shadow-lg' 
                : 'bg-white/5 text-white/70 hover:bg-white/10'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenu des onglets */}
      <div className="min-h-[300px]">
        {activeTab === 'identity' && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-xl font-semibold text-white mb-4">Ton Essence Radiance</h3>
            <div className="prose prose-invert max-w-none">
              <p className="text-white/90 leading-relaxed">
                {profile.profile.split('\n\n')[0]}
              </p>
            </div>
          </div>
        )}

        {activeTab === 'emotions' && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-xl font-semibold text-white mb-4">Ton Monde Émotionnel</h3>
            <div className="prose prose-invert max-w-none">
              <p className="text-white/90 leading-relaxed">
                {profile.profile.split('\n\n')[1] || "Contenu émotionnel en cours de chargement..."}
              </p>
            </div>
          </div>
        )}

        {activeTab === 'expression' && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-xl font-semibold text-white mb-4">Ton Style d'Expression</h3>
            <div className="prose prose-invert max-w-none">
              <p className="text-white/90 leading-relaxed">
                {profile.profile.split('\n\n')[2] || "Contenu expression en cours de chargement..."}
              </p>
            </div>
          </div>
        )}

        {activeTab === 'mission' && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="text-xl font-semibold text-white mb-4">Ta Mission d'Âme</h3>
            <div className="prose prose-invert max-w-none">
              <p className="text-white/90 leading-relaxed">
                {profile.profile.split('\n\n')[3] || "Contenu mission en cours de chargement..."}
              </p>
            </div>
          </div>
        )}

        {activeTab === 'synergy' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl p-6 border border-blue-500/30">
              <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                <span className="text-xl">⚡</span>
                Phrase de Synchronie
              </h4>
              <p className="text-blue-100 text-lg italic leading-relaxed">
                {profile.phrase_synchronie}
              </p>
            </div>

            {profile.compatible_matches && profile.compatible_matches.length > 0 && (
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <span className="text-xl">🤝</span>
                  Synergies Potentielles
                </h4>
                <div className="space-y-3">
                  {profile.compatible_matches.slice(0, 3).map((match, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {Math.round(match.compatibility.score * 10)}%
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-white">{match.profile.name}</div>
                        <div className="text-xs text-white/60 capitalize">
                          {match.compatibility.connectionType.replace(/_/g, ' ')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bouton d'action */}
      <div className="mt-8 pt-6 border-t border-white/10">
        <button
          onClick={onGenerateProject}
          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-4 px-6 rounded-xl transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-3"
        >
          <span className="text-xl">🚀</span>
          Créer mon Projet SpotBulle
          <span className="text-lg">→</span>
        </button>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
