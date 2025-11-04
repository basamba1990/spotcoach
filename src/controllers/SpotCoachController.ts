// src/controllers/SpotCoachController.ts
import { Request, Response } from 'express';
import { AstroCalculationService } from '../services/AstroCalculationService';
import { SymbolicInterpretationService } from '../services/SymbolicInterpretationService';
import { RedisCache } from '../utils/RedisCache';

export class SpotCoachController {
  private astroService: AstroCalculationService;
  private symbolicService: SymbolicInterpretationService;
  private cache: RedisCache;

  constructor() {
    this.astroService = new AstroCalculationService();
    this.symbolicService = new SymbolicInterpretationService();
    this.cache = new RedisCache();
  }

  async generateProfile(req: Request, res: Response) {
    try {
      const { birthData, userPreferences, sportPassion } = req.body;
      const userId = req.user.id;

      // Vérifier cache
      const cacheKey = `profile:${userId}:${this.hashBirthData(birthData)}`;
      const cached = await this.cache.get(cacheKey);
      
      if (cached) {
        return res.json(JSON.parse(cached));
      }

      // Calcul astrologique
      const natalChart = await this.astroService.calculateNatalChart(birthData);
      
      // Interprétation symbolique
      const profile = await this.symbolicService.interpretChart(
        natalChart, 
        userPreferences, 
        sportPassion
      );

      // Sauvegarde DB
      await this.saveProfileToDB(userId, profile, natalChart);

      // Cache pour 24h
      await this.cache.set(cacheKey, JSON.stringify(profile), 86400);

      res.json(profile);
      
    } catch (error) {
      console.error('Error generating profile:', error);
      res.status(500).json({ error: 'Erreur génération profil' });
    }
  }

  async getCompatibility(req: Request, res: Response) {
    try {
      const { targetUserId } = req.params;
      const userId = req.user.id;

      const compatibility = await this.symbolicService.calculateCompatibility(
        userId, 
        targetUserId
      );

      res.json(compatibility);
    } catch (error) {
      res.status(500).json({ error: 'Erreur calcul compatibilité' });
    }
  }
}
