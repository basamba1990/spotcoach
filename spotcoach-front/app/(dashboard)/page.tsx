// app/(dashboard)/page.tsx
'use client'

import { useUser } from '@/hooks/useUser'
import { useMatches } from '@/hooks/useMatches'
import { useProjects } from '@/hooks/useProjects'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { QuickStats } from '@/components/dashboard/QuickStats'
import { RecentMatches } from '@/components/matching/RecentMatches'
import { ProjectSuggestions } from '@/components/projects/ProjectSuggestions'
import { EnergyProfile } from '@/components/profile/EnergyProfile'

export default function DashboardPage() {
  const { user, profile, isLoading: userLoading } = useUser()
  const { matches, isLoading: matchesLoading } = useMatches()
  const { projects, isLoading: projectsLoading } = useProjects()

  if (userLoading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      <DashboardHeader user={user} profile={profile} />
      
      <div className="container mx-auto px-4 py-8">
        {/* Statistiques rapides */}
        <QuickStats userId={user.id} />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Colonne 1: Profil énergétique */}
          <div className="lg:col-span-1">
            <EnergyProfile profile={profile} />
          </div>
          
          {/* Colonne 2: Matches récents */}
          <div className="lg:col-span-1">
            <RecentMatches 
              matches={matches} 
              isLoading={matchesLoading}
            />
          </div>
          
          {/* Colonne 3: Projets suggérés */}
          <div className="lg:col-span-1">
            <ProjectSuggestions 
              projects={projects}
              isLoading={projectsLoading}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
