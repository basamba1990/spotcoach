// src/utils/date-calculations.ts
export class DateCalculations {
  static calculateAge(birthDate: Date): number {
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    
    return age
  }

  static getAgeGroup(age: number): string {
    if (age < 18) return 'teen'
    if (age < 25) return 'young_adult'
    if (age < 35) return 'adult'
    if (age < 50) return 'mature'
    return 'senior'
  }

  static calculatePlanetaryPeriod(startDate: Date, cycleYears: number): {
    currentPhase: number
    phaseProgress: number
    nextTransition: Date
  } {
    const now = new Date()
    const yearsPassed = (now.getTime() - startDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
    const cyclesPassed = yearsPassed / cycleYears
    const currentPhase = Math.floor(cyclesPassed % 12) // 12 phases like zodiac
    const phaseProgress = (cyclesPassed % 1) * 100
    
    const nextTransitionDate = new Date(startDate)
    nextTransitionDate.setFullYear(startDate.getFullYear() + Math.ceil(cyclesPassed) * cycleYears)
    
    return {
      currentPhase,
      phaseProgress,
      nextTransition: nextTransitionDate
    }
  }

  static isFavorableDay(userBirthDate: Date, currentDate: Date = new Date()): boolean {
    // Simplified favorable day calculation based on lunar phase and day of week
    const lunarPhase = this.getLunarPhase(currentDate)
    const dayOfWeek = currentDate.getDay()
    
    // Consider days around new moon and full moon as favorable
    const isLunarFavorable = lunarPhase < 0.1 || lunarPhase > 0.9
    
    // Consider Friday and Monday as favorable for social connections
    const isDayFavorable = [1, 5].includes(dayOfWeek)
    
    return isLunarFavorable || isDayFavorable
  }

  private static getLunarPhase(date: Date): number {
    // Simplified lunar phase calculation (0 = new moon, 0.5 = full moon, 1 = new moon)
    const LUNAR_CYCLE = 29.53 // days
    const knownNewMoon = new Date('2024-01-11') // A known new moon date
    
    const daysSinceNewMoon = (date.getTime() - knownNewMoon.getTime()) / (1000 * 60 * 60 * 24)
    const phase = (daysSinceNewMoon % LUNAR_CYCLE) / LUNAR_CYCLE
    
    return phase
  }

  static getBestTimeForActivity(activityType: string, userProfile: UserProfile): Date[] {
    const now = new Date()
    const suggestions: Date[] = []
    
    // Generate suggestions for the next 7 days
    for (let i = 0; i < 7; i++) {
      const date = new Date(now)
      date.setDate(now.getDate() + i)
      
      if (this.isFavorableDay(userProfile.birth_date, date)) {
        // Add morning (9 AM) and afternoon (3 PM) suggestions
        const morningTime = new Date(date)
        morningTime.setHours(9, 0, 0, 0)
        
        const afternoonTime = new Date(date)
        afternoonTime.setHours(15, 0, 0, 0)
        
        suggestions.push(morningTime, afternoonTime)
      }
    }
    
    return suggestions.slice(0, 5) // Return top 5 suggestions
  }
}
