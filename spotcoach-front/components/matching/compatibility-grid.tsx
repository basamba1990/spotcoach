// components/matching/compatibility-grid.tsx
'use client'

import { Match } from '@/types/matching'

interface CompatibilityGridProps {
  matches: Match[]
}

export function CompatibilityGrid({ matches }: CompatibilityGridProps) {
  const topMatches = matches.slice(0, 6)

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Grille de Compatibilité</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {topMatches.map((match, index) => (
          <div 
            key={match.id}
            className="bg-gray-700 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-600 transition-colors"
            title={`${match.user.full_name} - ${match.compatibilityScore}%`}
          >
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold mx-auto mb-2">
              {match.user.full_name.charAt(0)}
            </div>
            <div className="text-white text-sm font-medium truncate">
              {match.user.full_name.split(' ')[0]}
            </div>
            <div className="text-green-400 text-xs font-bold">
              {match.compatibilityScore}%
            </div>
            <div className="text-gray-400 text-xs mt-1">
              #{index + 1}
            </div>
          </div>
        ))}
      </div>

      {matches.length > 6 && (
        <div className="mt-4 text-center">
          <div className="text-gray-400 text-sm">
            +{matches.length - 6} autres matches
          </div>
        </div>
      )}
    </div>
  )
}
