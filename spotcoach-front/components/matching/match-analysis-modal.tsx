// components/matching/match-analysis-modal.tsx
'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CompatibilityChart } from '@/components/charts/compatibility-chart'
import { Badge } from '@/components/ui/badge'
import { SynergyIndicator } from './synergy-indicator'

interface MatchAnalysisModalProps {
  match: Match
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MatchAnalysisModal({ match, open, onOpenChange }: MatchAnalysisModalProps) {
  if (!match.analysis) return null

  const analysis = match.analysis

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>Analyse de Compatibilité avec {match.user.full_name}</span>
            <Badge variant="secondary">
              {analysis.overallScore}/10
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Radar de compatibilité */}
          <CompatibilityChart
            matchData={analysis.compatibilityBreakdown}
            partnerData={analysis.partnerBreakdown}
          />

          {/* Synergie globale */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-white mb-4">Synergie Globale</h4>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm text-gray-300 mb-2">
                  <span>Niveau de Synergie</span>
                  <span>{analysis.synergyLevel}%</span>
                </div>
                <SynergyIndicator synergy={analysis.synergyLevel} />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h5 className="text-sm font-medium text-gray-300 mb-2">Points Forts</h5>
                  <ul className="text-sm text-gray-400 space-y-1">
                    {analysis.strengths.map((strength, index) => (
                      <li key={index}>✓ {strength}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h5 className="text-sm font-medium text-gray-300 mb-2">Défis Potentiels</h5>
                  <ul className="text-sm text-gray-400 space-y-1">
                    {analysis.challenges.map((challenge, index) => (
                      <li key={index}>⚠️ {challenge}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Complémentarité Astrologique */}
          {analysis.astroCompatibility && (
            <div className="bg-gray-800 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-white mb-4">Complémentarité Astrologique</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl mb-2">☀️</div>
                  <div className="text-sm text-gray-300">Soleil</div>
                  <div className="text-white font-medium">{analysis.astroCompatibility.sun}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-2">🌙</div>
                  <div className="text-sm text-gray-300">Lune</div>
                  <div className="text-white font-medium">{analysis.astroCompatibility.moon}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-2">🔼</div>
                  <div className="text-sm text-gray-300">Ascendant</div>
                  <div className="text-white font-medium">{analysis.astroCompatibility.rising}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-2">⚡</div>
                  <div className="text-sm text-gray-300">Énergie</div>
                  <div className="text-white font-medium">{analysis.astroCompatibility.energy}</div>
                </div>
              </div>
            </div>
          )}

          {/* Recommandations */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-white mb-4">Recommandations</h4>
            <div className="space-y-3">
              {analysis.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-700 rounded-lg">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <h5 className="text-white font-medium mb-1">{recommendation.title}</h5>
                    <p className="text-gray-400 text-sm">{recommendation.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
