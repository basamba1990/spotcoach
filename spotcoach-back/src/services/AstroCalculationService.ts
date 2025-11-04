// src/services/AstroCalculationService.ts
import { swe, Sweph } from 'sweph'
import { RedisCache } from '../utils/redis-cache'

export interface BirthData {
  date: string // YYYY-MM-DD
  time: string // HH:MM:SS
  latitude: number
  longitude: number
  timezone: string
}

export interface PlanetaryPosition {
  longitude: number
  latitude: number
  speed: number
  sign: string
  degree: number
  house: number
}

export interface NatalChart {
  planets: Record<string, PlanetaryPosition>
  houses: number[]
  aspects: AstroAspect[]
  calculatedAt: Date
}

export class AstroCalculationService {
  private cache: RedisCache

  constructor() {
    this.cache = new RedisCache()
    swe.set_ephe_path(process.env.SWISS_EPHEMERIS_PATH || './ephemerides')
  }

  async calculateNatalChart(birthData: BirthData): Promise<NatalChart> {
    const cacheKey = `natal-chart:${this.hashBirthData(birthData)}`
    const cached = await this.cache.get<NatalChart>(cacheKey)
    
    if (cached) {
      return cached
    }

    const julianDay = this.calculateJulianDay(birthData.date, birthData.time)
    const planets = await this.calculatePlanetaryPositions(julianDay)
    const houses = await this.calculateHouses(julianDay, birthData.latitude, birthData.longitude)
    const aspects = await this.calculateAspects(planets)

    const natalChart: NatalChart = {
      planets,
      houses,
      aspects,
      calculatedAt: new Date()
    }

    await this.cache.set(cacheKey, natalChart, 86400) // Cache 24h

    return natalChart
  }

  private calculatePlanetaryPositions(julianDay: number): Record<string, PlanetaryPosition> {
    const planets: Record<string, PlanetaryPosition> = {}
    const PLANETS = {
      SUN: swe.SUN,
      MOON: swe.MOON,
      MERCURY: swe.MERCURY,
      VENUS: swe.VENUS,
      MARS: swe.MARS,
      JUPITER: swe.JUPITER,
      SATURN: swe.SATURN,
      URANUS: swe.URANUS,
      NEPTUNE: swe.NEPTUNE,
      PLUTO: swe.PLUTO
    }

    for (const [planetName, planetCode] of Object.entries(PLANETS)) {
      const result = swe.calc_ut(julianDay, planetCode, swe.FLG_SWIEPH)
      const longitude = result.longitude
      
      planets[planetName] = {
        longitude,
        latitude: result.latitude,
        speed: result.speed,
        sign: this.getSign(longitude),
        degree: this.getDegree(longitude),
        house: this.calculateHouse(longitude)
      }
    }

    return planets
  }

  private calculateHouses(julianDay: number, lat: number, lng: number): number[] {
    const houses = swe.houses(julianDay, lat, lng, 'P')
    return houses.house.map((cuspid: number) => cuspid)
  }

  private calculateAspects(planets: Record<string, PlanetaryPosition>): AstroAspect[] {
    const aspects: AstroAspect[] = []
    const planetEntries = Object.entries(planets)
    
    for (let i = 0; i < planetEntries.length; i++) {
      for (let j = i + 1; j < planetEntries.length; j++) {
        const [planetA, dataA] = planetEntries[i]
        const [planetB, dataB] = planetEntries[j]
        
        const angle = Math.abs(dataA.longitude - dataB.longitude)
        const normalizedAngle = angle > 180 ? 360 - angle : angle
        
        const aspect = this.getAspectForAngle(normalizedAngle)
        if (aspect) {
          aspects.push({
            planetA,
            planetB,
            angle: normalizedAngle,
            type: aspect.type,
            orb: Math.abs(normalizedAngle - aspect.exactAngle),
            nature: aspect.nature
          })
        }
      }
    }
    
    return aspects
  }

  private getSign(longitude: number): string {
    const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 
                   'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces']
    const signIndex = Math.floor(longitude / 30)
    return signs[signIndex]
  }

  private getDegree(longitude: number): number {
    return longitude % 30
  }

  private calculateHouse(longitude: number): number {
    // Simplified house calculation
    return Math.floor(longitude / 30) + 1
  }

  private getAspectForAngle(angle: number): { type: string; exactAngle: number; nature: 'harmonic' | 'challenging' } | null {
    const aspects = [
      { type: 'conjunction', exactAngle: 0, nature: 'neutral' as const },
      { type: 'sextile', exactAngle: 60, nature: 'harmonic' as const },
      { type: 'square', exactAngle: 90, nature: 'challenging' as const },
      { type: 'trine', exactAngle: 120, nature: 'harmonic' as const },
      { type: 'opposition', exactAngle: 180, nature: 'challenging' as const }
    ]

    for (const aspect of aspects) {
      if (Math.abs(angle - aspect.exactAngle) <= 8) { // 8° orb
        return aspect
      }
    }
    
    return null
  }

  private calculateJulianDay(date: string, time: string): number {
    const dateTime = new Date(`${date}T${time}Z`)
    return swe.julday(
      dateTime.getUTCFullYear(),
      dateTime.getUTCMonth() + 1,
      dateTime.getUTCDate(),
      dateTime.getUTCHours() + dateTime.getUTCMinutes() / 60 + dateTime.getUTCSeconds() / 3600,
      swe.GREG_CAL
    )
  }

  private hashBirthData(birthData: BirthData): string {
    return Buffer.from(JSON.stringify(birthData)).toString('base64')
  }
}
