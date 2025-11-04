// hooks/useAuth.ts
import { useAuthStore } from '@/stores/auth-store'

export function useAuth() {
  const { user, isLoading, signIn, signUp, signOut, resetPassword } = useAuthStore()

  return {
    user,
    isLoading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    isAuthenticated: !!user,
  }
}
