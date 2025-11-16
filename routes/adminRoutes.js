import express from 'express';
import { getAnalytics, getUserAnalyticsData, getDashboardStats } from '../controllers/adminController.js';

const router = express.Router();

router.get('/analytics', getAnalytics);
router.get('/dashboard', getDashboardStats);
router.get('/users/:userId/analytics', getUserAnalyticsData);

export default router;
