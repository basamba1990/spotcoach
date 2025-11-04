// src/services/AstroCalculationService.ts
import { swe, Sweph } from 'sweph';

export class AstroCalculationService {
  private ephePath: string;

  constructor() {
    this.ephePath = process.env.SWISS_EPHEMERIS_PATH || './ephemerides';
    swe.set_ephe_path(this.ephePath);
  }

  async calculateNatalChart(birthData: BirthData): Promise<NatalChart> {
    const { date, time, latitude, longitude } = birthData;
    
    // Conversion date/heure en Julian Day
    const julianDay = this.calculateJulianDay(date, time);
    
    // Calcul positions planétaires
    const planets = await this.calculatePlanetaryPositions(julianDay);
    
    // Calcul maisons
    const houses = await this.calculateHouses(julianDay, latitude, longitude);
    
    // Calcul aspects
    const aspects = await this.calculateAspects(planets);
    
    return {
      planets,
      houses,
      aspects,
      calculatedAt: new Date()
    };
  }

  private calculatePlanetaryPositions(julianDay: number): PlanetaryPositions {
    const planets: PlanetaryPositions = {};
    
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
    };

    for (const [planetName, planetCode] of Object.entries(PLANETS)) {
      const result = swe.calc_ut(julianDay, planetCode, swe.FLG_SWIEPH);
      planets[planetName] = {
        longitude: result.longitude,
        latitude: result.latitude,
        speed: result.speed,
        sign: this.getSign(result.longitude),
        degree: this.getDegree(result.longitude)
      };
    }
    
    return planets;
  }
}
