// hooks/useProfile.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useProfileStore } from '@/stores/profile-store'
import { api } from '@/lib/api'

export function useProfile() {
  const { profile, setProfile } = useProfileStore()
  const queryClient = useQueryClient()

  const { isLoading, error } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const data = await api.getProfile()
      setProfile(data)
      return data
    },
    enabled: !profile,
  })

  const updateMutation = useMutation({
    mutationFn: (data: Partial<UserProfile>) => api.updateProfile(data),
    onSuccess: (updatedProfile) => {
      setProfile(updatedProfile)
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })

  const calculateEnergyProfileMutation = useMutation({
    mutationFn: () => api.calculateEnergyProfile(),
    onSuccess: (energyProfile) => {
      if (profile) {
        setProfile({
          ...profile,
          energy_profile: energyProfile
        })
      }
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })

  return {
    profile,
    isLoading,
    error,
    updateProfile: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    calculateEnergyProfile: calculateEnergyProfileMutation.mutate,
    isCalculatingEnergy: calculateEnergyProfileMutation.isPending,
  }
}
