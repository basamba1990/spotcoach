// src/routes/matching.ts
import { Router } from 'express';
import { MatchingController } from '../controllers/MatchingController';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const matchingController = new MatchingController();

router.post('/matches', authMiddleware, matchingController.findMatches.bind(matchingController));
router.get('/matches/analysis/:targetUserId', authMiddleware, matchingController.getMatchAnalysis.bind(matchingController));
router.get('/clusters/similar', authMiddleware, matchingController.getSimilarClusters.bind(matchingController));
router.post('/matches/feedback', authMiddleware, matchingController.saveMatchFeedback.bind(matchingController));

// Admin endpoints
router.get('/admin/clusters', authMiddleware, matchingController.getClusterAnalysis.bind(matchingController));
router.post('/admin/clusters/recalculate', authMiddleware, matchingController.recalculateClusters.bind(matchingController));

export default router;
