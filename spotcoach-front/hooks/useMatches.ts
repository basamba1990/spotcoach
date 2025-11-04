// hooks/useMatches.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export function useMatches() {
  const queryClient = useQueryClient()
  
  const { data: matches, isLoading, error } = useQuery({
    queryKey: ['matches'],
    queryFn: () => api.getMatches(),
    staleTime: 5 * 60 * 1000,
  })

  const interestMutation = useMutation({
    mutationFn: ({ matchId, interest }: { matchId: string; interest: boolean }) =>
      api.saveMatchInterest(matchId, interest),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] })
    }
  })

  const generateMatchesMutation = useMutation({
    mutationFn: (filters?: MatchFilters) => api.generateMatches(filters),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] })
    }
  })

  return {
    matches: matches || [],
    isLoading,
    error,
    saveInterest: interestMutation.mutate,
    generateMatches: generateMatchesMutation.mutate,
    isGenerating: generateMatchesMutation.isPending
  }
}
