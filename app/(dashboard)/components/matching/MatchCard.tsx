// components/matching/MatchCard.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MatchAnalysisModal } from './MatchAnalysisModal'
import { ProjectSuggestionsModal } from '../projects/ProjectSuggestionsModal'

interface MatchCardProps {
  match: Match
  onInterest: (matchId: string, interest: boolean) => void
}

export function MatchCard({ match, onInterest }: MatchCardProps) {
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [showProjects, setShowProjects] = useState(false)

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-blue-500 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={match.user.avatar_url} />
            <AvatarFallback>
              {match.user.full_name?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          
          <div>
            <h3 className="font-semibold text-white">
              {match.user.full_name}
            </h3>
            <p className="text-gray-400 text-sm">
              {match.user.bio}
            </p>
            
            <div className="flex flex-wrap gap-1 mt-2">
              <Badge variant="secondary">
                {match.compatibilityScore}% compatibilité
              </Badge>
              <Badge variant="outline">
                {match.matchType}
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAnalysis(true)}
          >
            Analyse
          </Button>
          <Button
            size="sm"
            onClick={() => setShowProjects(true)}
          >
            Projets
          </Button>
        </div>
      </div>

      {/* Points clés de compatibilité */}
      <div className="mt-4">
        <h4 className="text-sm font-medium text-gray-300 mb-2">
          Synergies détectées:
        </h4>
        <ul className="text-sm text-gray-400 space-y-1">
          {match.complementaryAspects.slice(0, 3).map((aspect, index) => (
            <li key={index}>• {aspect}</li>
          ))}
        </ul>
      </div>

      {/* Actions */}
      <div className="flex space-x-2 mt-4">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => onInterest(match.id, false)}
        >
          Passer
        </Button>
        <Button
          className="flex-1"
          onClick={() => onInterest(match.id, true)}
        >
          Connecter
        </Button>
      </div>

      {/* Modals */}
      <MatchAnalysisModal
        match={match}
        open={showAnalysis}
        onOpenChange={setShowAnalysis}
      />
      
      <ProjectSuggestionsModal
        match={match}
        open={showProjects}
        onOpenChange={setShowProjects}
      />
    </div>
  )
}
