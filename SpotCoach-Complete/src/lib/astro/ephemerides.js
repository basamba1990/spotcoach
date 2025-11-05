import { SwissEphemerisCalculator } from './sweph-calculations';
import symbols from './symbols.json';

export class EphemeridesCalculator {
  static async getPlanetaryPositions(date, time, lat, lon) {
    try {
      const astroData = await SwissEphemerisCalculator.getCompleteAstroData(date, time, lat, lon);
      
      return {
        soleil: astroData.planets.soleil,
        lune: astroData.planets.lune,
        ascendant: astroData.houses.ascendant,
        mercure: astroData.planets.mercure,
        venus: astroData.planets.venus,
        mars: astroData.planets.mars,
        aspects: astroData.aspects,
        midheaven: astroData.houses.midheaven
      };
    } catch (error) {
      console.error('Erreur calcul positions:', error);
      // Fallback vers calcul simplifié
      return this.getFallbackPositions(date, time, lat, lon);
    }
  }

  static getFallbackPositions(date, time, lat, lon) {
    const datetime = new Date(`${date}T${time}`);
    const dayOfYear = this.getDayOfYear(datetime);
    
    return {
      soleil: {
        longitude: (dayOfYear / 365.25) * 360,
        sign: this.getZodiacSignSimple((dayOfYear / 365.25) * 360),
        element: this.getElement(this.getZodiacSignSimple((dayOfYear / 365.25) * 360))
      },
      lune: {
        longitude: ((datetime.getTime() / (1000 * 60 * 60 * 24)) % 29.53) / 29.53 * 360,
        sign: this.getZodiacSignSimple(((datetime.getTime() / (1000 * 60 * 60 * 24)) % 29.53) / 29.53 * 360),
        element: this.getElement(this.getZodiacSignSimple(((datetime.getTime() / (1000 * 60 * 60 * 24)) % 29.53) / 29.53 * 360))
      },
      ascendant: {
        longitude: ((datetime.getHours() + datetime.getMinutes() / 60 + lon / 15) % 24) * 15,
        sign: this.getZodiacSignSimple(((datetime.getHours() + datetime.getMinutes() / 60 + lon / 15) % 24) * 15),
        element: this.getElement(this.getZodiacSignSimple(((datetime.getHours() + datetime.getMinutes() / 60 + lon / 15) % 24) * 15))
      }
    };
  }

  static getZodiacSignSimple(longitude) {
    const signs = ['Bélier', 'Taureau', 'Gémeaux', 'Cancer', 'Lion', 'Vierge', 'Balance', 'Scorpion', 'Sagittaire', 'Capricorne', 'Verseau', 'Poissons'];
    return signs[Math.floor((longitude % 360) / 30)];
  }

  static getElement(sign) {
    const elements = {
      'Bélier': 'Feu', 'Lion': 'Feu', 'Sagittaire': 'Feu',
      'Taureau': 'Terre', 'Vierge': 'Terre', 'Capricorne': 'Terre',
      'Gémeaux': 'Air', 'Balance': 'Air', 'Verseau': 'Air',
      'Cancer': 'Eau', 'Scorpion': 'Eau', 'Poissons': 'Eau'
    };
    return elements[sign] || 'Inconnu';
  }

  static getDayOfYear(date) {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date - start;
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
  }

  static getPlanetaryArchtype(planetData) {
    const planetSymbols = symbols.planètes[this.capitalizeFirstLetter(planetData.planet)];
    const elementSymbols = symbols.éléments[planetData.element];
    
    return {
      archétype: planetSymbols?.archétype || elementSymbols?.archétype || 'Explorateur',
      couleur: planetSymbols?.couleur || elementSymbols?.couleur || 'Violet',
      description: `${planetSymbols?.description || ''} Dans l'élément ${planetData.element}, tu exprimes tes qualités ${elementSymbols?.qualités?.join(', ') || 'uniques'}.`
    };
  }

  static capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
}
