// hooks/useUser.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth-store'
import { api } from '@/lib/api'

export function useUser() {
  const { user } = useAuthStore()
  
  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['user', 'profile', user?.id],
    queryFn: () => api.getUserProfile(),
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const updateProfileMutation = useMutation({
    mutationFn: (data: Partial<UserProfile>) => api.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'profile'] })
    }
  })

  return {
    user,
    profile,
    isLoading,
    error,
    updateProfile: updateProfileMutation.mutate,
    isUpdating: updateProfileMutation.isPending
  }
}
