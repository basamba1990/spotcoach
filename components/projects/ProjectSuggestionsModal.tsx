// components/projects/ProjectSuggestionsModal.tsx
'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useProjectRecommendations } from '@/hooks/useProjectRecommendations'
import { ProjectInterestForm } from './ProjectInterestForm'

interface ProjectSuggestionsModalProps {
  match: Match
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProjectSuggestionsModal({ match, open, onOpenChange }: ProjectSuggestionsModalProps) {
  const { projects, isLoading, generateProjects } = useProjectRecommendations(
    match.user.id
  )
  const [selectedProject, setSelectedProject] = useState<CollaborativeProject | null>(null)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Projets collaboratifs avec {match.user.full_name}
          </DialogTitle>
        </DialogHeader>

        {!projects && !isLoading && (
          <div className="text-center py-8">
            <p className="text-gray-400 mb-4">
              Générez des idées de projets basées sur votre synergie
            </p>
            <Button onClick={() => generateProjects()}>
              Générer des projets
            </Button>
          </div>
        )}

        {isLoading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        )}

        {projects && (
          <div className="space-y-4">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-gray-800 rounded-lg p-6 border border-gray-700"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-white text-lg">
                      {project.title}
                    </h3>
                    <p className="text-gray-400 mt-2">
                      {project.description}
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="secondary">
                      {project.difficulty}
                    </Badge>
                    <Badge variant="outline">
                      {project.estimatedDuration}
                    </Badge>
                  </div>
                </div>

                {/* Rôles complémentaires */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">
                    Rôles suggérés:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {project.complementaryRoles.map((role, index) => (
                      <Badge key={index} variant="default">
                        {role}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Métriques de succès */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">
                    Indicateurs de succès:
                  </h4>
                  <ul className="text-sm text-gray-400 space-y-1">
                    {project.successMetrics.map((metric, index) => (
                      <li key={index}>• {metric}</li>
                    ))}
                  </ul>
                </div>

                <Button
                  onClick={() => setSelectedProject(project)}
                  className="w-full"
                >
                  Exprimer mon intérêt
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Formulaire d'intérêt */}
        <ProjectInterestForm
          project={selectedProject}
          match={match}
          open={!!selectedProject}
          onOpenChange={(open) => !open && setSelectedProject(null)}
        />
      </DialogContent>
    </Dialog>
  )
}
