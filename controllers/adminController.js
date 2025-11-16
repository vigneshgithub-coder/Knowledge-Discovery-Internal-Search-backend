import { getAdminAnalytics, getUserAnalytics } from '../services/adminAnalyticsService.js';
import { ValidationError } from '../utils/errors.js';

export async function getAnalytics(req, res, next) {
  try {
    const analytics = await getAdminAnalytics();

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    next(error);
  }
}

export async function getUserAnalyticsData(req, res, next) {
  try {
    const { userId } = req.params;

    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    const analytics = await getUserAnalytics(userId);

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    next(error);
  }
}

export async function getDashboardStats(req, res, next) {
  try {
    const analytics = await getAdminAnalytics();

    // Extract key metrics for dashboard
    const dashboardStats = {
      totalUsers: analytics.totalUsers,
      totalDocuments: analytics.totalDocuments,
      totalSearches: analytics.totalSearches,
      recentActivity: {
        recentSearches: analytics.recentSearches.slice(0, 5),
        trendingQueries: analytics.trendingQueries.slice(0, 5),
        topProjects: analytics.popularProjects.slice(0, 5)
      },
      breakdowns: {
        categories: analytics.categoryBreakdown,
        teams: analytics.teamBreakdown
      },
      trends: {
        uploads: analytics.uploadTrends.slice(-7), // Last 7 days
        searches: analytics.searchTrends.slice(-7)  // Last 7 days
      }
    };

    res.json({
      success: true,
      data: dashboardStats
    });
  } catch (error) {
    next(error);
  }
}
