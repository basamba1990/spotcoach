const SWeph = require('sweph');

// Configuration des chemins d'éphémérides
SWeph.set_ephe_path(process.cwd() + '/public/ephemerides');

export class SwissEphemerisCalculator {
  static calculateJulianDay(date, time) {
    const datetime = new Date(`${date}T${time}`);
    const year = datetime.getFullYear();
    const month = datetime.getMonth() + 1;
    const day = datetime.getDate();
    const hour = datetime.getHours();
    const minute = datetime.getMinutes();
    const second = datetime.getSeconds();

    const julianDay = SWeph.julday(year, month, day, hour + minute/60 + second/3600, SWeph.SE_GREG_CAL);
    return julianDay;
  }

  static calculateHouseSystem(julianDay, lat, lon) {
    // Calcul du système de maisons (Placidus)
    const houses = SWeph.houses(julianDay, lat, lon, 'P');
    return houses;
  }

  static calculatePlanetaryPositions(julianDay) {
    const flags = SWeph.SEFLG_SWIEPH | SWeph.SEFLG_SPEED;

    // Calcul des positions planétaires
    const planets = {
      soleil: SWeph.calc_ut(julianDay, SWeph.SE_SUN, flags),
      lune: SWeph.calc_ut(julianDay, SWeph.SE_MOON, flags),
      mercure: SWeph.calc_ut(julianDay, SWeph.SE_MERCURY, flags),
      venus: SWeph.calc_ut(julianDay, SWeph.SE_VENUS, flags),
      mars: SWeph.calc_ut(julianDay, SWeph.SE_MARS, flags),
      jupiter: SWeph.calc_ut(julianDay, SWeph.SE_JUPITER, flags),
      saturne: SWeph.calc_ut(julianDay, SWeph.SE_SATURN, flags)
    };

    return planets;
  }

  static getZodiacSign(longitude) {
    const signs = [
      { name: 'Bélier', start: 0, end: 30, element: 'Feu' },
      { name: 'Taureau', start: 30, end: 60, element: 'Terre' },
      { name: 'Gémeaux', start: 60, end: 90, element: 'Air' },
      { name: 'Cancer', start: 90, end: 120, element: 'Eau' },
      { name: 'Lion', start: 120, end: 150, element: 'Feu' },
      { name: 'Vierge', start: 150, end: 180, element: 'Terre' },
      { name: 'Balance', start: 180, end: 210, element: 'Air' },
      { name: 'Scorpion', start: 210, end: 240, element: 'Eau' },
      { name: 'Sagittaire', start: 240, end: 270, element: 'Feu' },
      { name: 'Capricorne', start: 270, end: 300, element: 'Terre' },
      { name: 'Verseau', start: 300, end: 330, element: 'Air' },
      { name: 'Poissons', start: 330, end: 360, element: 'Eau' }
    ];

    const normalizedLongitude = longitude % 360;
    const sign = signs.find(s => normalizedLongitude >= s.start && normalizedLongitude < s.end);
    return sign || signs[0];
  }

  static calculateAspects(planets) {
    const aspects = [];
    const planetKeys = Object.keys(planets);
    
    for (let i = 0; i < planetKeys.length; i++) {
      for (let j = i + 1; j < planetKeys.length; j++) {
        const planet1 = planets[planetKeys[i]];
        const planet2 = planets[planetKeys[j]];
        const angle = Math.abs(planet1.longitude - planet2.longitude) % 360;
        
        // Aspects majeurs
        if (Math.abs(angle - 0) < 3) aspects.push({ type: 'Conjonction', planets: [planetKeys[i], planetKeys[j]] });
        else if (Math.abs(angle - 60) < 3) aspects.push({ type: 'Sextile', planets: [planetKeys[i], planetKeys[j]] });
        else if (Math.abs(angle - 90) < 3) aspects.push({ type: 'Carré', planets: [planetKeys[i], planetKeys[j]] });
        else if (Math.abs(angle - 120) < 3) aspects.push({ type: 'Trine', planets: [planetKeys[i], planetKeys[j]] });
        else if (Math.abs(angle - 180) < 3) aspects.push({ type: 'Opposition', planets: [planetKeys[i], planetKeys[j]] });
      }
    }
    
    return aspects;
  }

  static async getCompleteAstroData(date, time, lat, lon) {
    try {
      const julianDay = this.calculateJulianDay(date, time);
      const houses = this.calculateHouseSystem(julianDay, lat, lon);
      const planets = this.calculatePlanetaryPositions(julianDay);
      const aspects = this.calculateAspects(planets);

      // Calcul des signes et éléments
      const planetaryData = {};
      for (const [planet, data] of Object.entries(planets)) {
        const sign = this.getZodiacSign(data.longitude);
        planetaryData[planet] = {
          longitude: data.longitude,
          latitude: data.latitude,
          speed: data.speed,
          sign: sign.name,
          element: sign.element,
          degree: data.longitude % 30
        };
      }

      return {
        houses: {
          ascendant: {
            longitude: houses.ascendant,
            sign: this.getZodiacSign(houses.ascendant)
          },
          midheaven: {
            longitude: houses.mc,
            sign: this.getZodiacSign(houses.mc)
          }
        },
        planets: planetaryData,
        aspects,
        julianDay
      };

    } catch (error) {
      console.error('Erreur calcul Swiss Ephemeris:', error);
      throw new Error('Calcul astrologique échoué');
    }
  }
}
