// components/projects/project-suggestions-modal.tsx
'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useProjectRecommendations } from '@/hooks/useProjectRecommendations'
import { ProjectInterestForm } from './project-interest-form'
import { ProjectTimeline } from './project-timeline'
import { RoleAssignment } from './role-assignment'

interface ProjectSuggestionsModalProps {
  match: Match
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProjectSuggestionsModal({ match, open, onOpenChange }: ProjectSuggestionsModalProps) {
  const { projects, isLoading, generateProjects } = useProjectRecommendations(match.user.id)
  const [selectedProject, setSelectedProject] = useState<CollaborativeProject | null>(null)
  const [view, setView] = useState<'list' | 'details'>('list')

  const handleGenerateProjects = async () => {
    await generateProjects()
    setView('list')
  }

  if (view === 'details' && selectedProject) {
    return (
      <ProjectDetailsView
        project={selectedProject}
        match={match}
        onBack={() => {
          setSelectedProject(null)
          setView('list')
        }}
        onInterest={() => setSelectedProject(null)}
      />
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Projets avec {match.user.full_name}
          </DialogTitle>
        </DialogHeader>

        {!projects && !isLoading && (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🚀</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Projets Collaboratifs
            </h3>
            <p className="text-gray-400 mb-6">
              Générez des idées de projets basées sur votre synergie unique avec {match.user.full_name}
            </p>
            <Button 
              onClick={handleGenerateProjects}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              ✨ Générer des Projets
            </Button>
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-400">Génération des projets en cours...</p>
            <p className="text-gray-500 text-sm mt-2">
              Analyse de votre synergie et création de projets personnalisés
            </p>
          </div>
        )}

        {projects && projects.length > 0 && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h4 className="text-lg font-semibold text-white">
                {projects.length} Projets Suggerés
              </h4>
              <Button
                onClick={handleGenerateProjects}
                variant="outline"
                size="sm"
              >
                🔄 Regénérer
              </Button>
            </div>

            <div className="space-y-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-blue-500 transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedProject(project)
                    setView('details')
                  }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white text-lg mb-2">
                        {project.title}
                      </h3>
                      <p className="text-gray-400">
                        {project.description}
                      </p>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 ml-4">
                      <Badge variant="secondary">
                        {project.difficulty}
                      </Badge>
                      <Badge variant="outline">
                        {project.estimatedDuration}
                      </Badge>
                      <Badge className="bg-green-600">
                        Impact: {project.potentialImpact}/10
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-2">
                      {project.complementaryRoles.slice(0, 2).map((role, index) => (
                        <Badge key={index} variant="default" className="bg-blue-600">
                          {role}
                        </Badge>
                      ))}
                      {project.complementaryRoles.length > 2 && (
                        <Badge variant="outline">
                          +{project.complementaryRoles.length - 2} autres
                        </Badge>
                      )}
                    </div>
                    
                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedProject(project)
                        setView('details')
                      }}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Voir Détails →
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {projects && projects.length === 0 && !isLoading && (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">😔</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Aucun Projet Trouvé
            </h3>
            <p className="text-gray-400 mb-6">
              Nous n'avons pas pu générer de projets pour le moment.
            </p>
            <Button onClick={handleGenerateProjects}>
              Réessayer
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function ProjectDetailsView({ 
  project, 
  match, 
  onBack, 
  onInterest 
}: { 
  project: CollaborativeProject
  match: Match
  onBack: () => void
  onInterest: () => void
}) {
  const [showInterestForm, setShowInterestForm] = useState(false)

  if (showInterestForm) {
    return (
      <ProjectInterestForm
        project={project}
        match={match}
        open={true}
        onOpenChange={(open) => {
          if (!open) {
            setShowInterestForm(false)
            onInterest()
          }
        }}
      />
    )
  }

  return (
    <Dialog open={true} onOpenChange={() => onBack()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={onBack}>
              ← Retour
            </Button>
            <DialogTitle>{project.title}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* En-tête du projet */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold mb-2">{project.title}</h2>
                <p className="text-blue-100">{project.description}</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold mb-1">{project.potentialImpact}/10</div>
                <div className="text-blue-200 text-sm">Impact Potentiel</div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="bg-white/20">
                {project.projectType}
              </Badge>
              <Badge variant="secondary" className="bg-white/20">
                {project.difficulty}
              </Badge>
              <Badge variant="secondary" className="bg-white/20">
                {project.estimatedDuration}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Colonne principale */}
            <div className="lg:col-span-2 space-y-6">
              {/* Rôles complémentaires */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Rôles Complémentaires</h3>
                <RoleAssignment roles={project.complementaryRoles} />
              </div>

              {/* Timeline */}
              {project.suggestedTimeline && (
                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Déroulement du Projet</h3>
                  <ProjectTimeline timeline={project.suggestedTimeline} />
                </div>
              )}

              {/* Défis et Solutions */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Défis et Solutions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Défis Potentiels</h4>
                    <ul className="text-sm text-gray-400 space-y-1">
                      {project.potentialChallenges.map((challenge, index) => (
                        <li key={index}>• {challenge}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Stratégies</h4>
                    <ul className="text-sm text-gray-400 space-y-1">
                      {project.mitigationStrategies.map((strategy, index) => (
                        <li key={index}>• {strategy}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Colonne latérale */}
            <div className="space-y-6">
              {/* Ressources nécessaires */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Ressources</h3>
                <div className="space-y-2">
                  {project.resourcesNeeded.map((resource, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-gray-300">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      {resource}
                    </div>
                  ))}
                </div>
              </div>

              {/* Métriques de succès */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Indicateurs de Succès</h3>
                <div className="space-y-2">
                  {project.successMetrics.map((metric, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-gray-300">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      {metric}
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div className="bg-gray-800 rounded-lg p-6 border border-green-500">
                <h3 className="text-lg font-semibold text-white mb-2">Intéressé par ce projet ?</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Exprimez votre intérêt et nous vous mettrons en contact avec {match.user.full_name}
                </p>
                <Button
                  onClick={() => setShowInterestForm(true)}
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  🎯 Exprimer mon Intérêt
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
