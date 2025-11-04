// hooks/useProjectRecommendations.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export function useProjectRecommendations(partnerId: string) {
  const queryClient = useQueryClient()
  
  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects', partnerId],
    queryFn: () => api.getProjectsForMatch(partnerId),
    enabled: false // Ne fetch pas automatiquement
  })

  const generateMutation = useMutation({
    mutationFn: () => api.generateProjects(partnerId),
    onSuccess: (data) => {
      queryClient.setQueryData(['projects', partnerId], data.projects)
    }
  })

  return {
    projects,
    isLoading: isLoading || generateMutation.isPending,
    generateProjects: generateMutation.mutate,
    error: generateMutation.error
  }
}

// hooks/useMatches.ts
export function useMatches() {
  return useQuery({
    queryKey: ['matches'],
    queryFn: () => api.getMatches(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
