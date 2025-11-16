import Document from '../models/Document.js';
import SearchHistory from '../models/SearchHistory.js';
import User from '../models/User.js';
import { DatabaseError } from '../utils/errors.js';

export async function getAdminAnalytics() {
  try {
    const [
      totalUsers,
      totalDocuments,
      totalSearches,
      recentSearches,
      trendingQueries,
      popularProjects,
      topUsers,
      categoryBreakdown,
      teamBreakdown,
      uploadTrends,
      searchTrends
    ] = await Promise.all([
      getTotalUsers(),
      getTotalDocuments(),
      getTotalSearches(),
      getRecentSearches(),
      getTrendingQueries(),
      getPopularProjects(),
      getTopUsers(),
      getCategoryBreakdown(),
      getTeamBreakdown(),
      getUploadTrends(),
      getSearchTrends()
    ]);

    return {
      totalUsers,
      totalDocuments,
      totalSearches,
      recentSearches,
      trendingQueries,
      popularProjects,
      topUsers,
      categoryBreakdown,
      teamBreakdown,
      uploadTrends,
      searchTrends
    };
  } catch (error) {
    console.error('Error fetching admin analytics:', error);
    throw new DatabaseError(`Failed to fetch analytics: ${error.message}`);
  }
}

async function getTotalUsers() {
  return await User.countDocuments();
}

async function getTotalDocuments() {
  return await Document.countDocuments({ processed: true });
}

async function getTotalSearches() {
  return await SearchHistory.countDocuments();
}

async function getRecentSearches(limit = 10) {
  return await SearchHistory
    .find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('query userName userEmail projectName createdAt resultsCount')
    .lean();
}

async function getTrendingQueries(limit = 10) {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  return await SearchHistory.aggregate([
    {
      $match: {
        createdAt: { $gte: sevenDaysAgo }
      }
    },
    {
      $group: {
        _id: '$query',
        count: { $sum: 1 },
        lastSearched: { $max: '$createdAt' }
      }
    },
    { $sort: { count: -1, lastSearched: -1 } },
    { $limit: limit },
    {
      $project: {
        query: '$_id',
        count: 1,
        lastSearched: 1,
        _id: 0
      }
    }
  ]);
}

async function getPopularProjects(limit = 10) {
  return await Document.aggregate([
    {
      $group: {
        _id: '$project',
        count: { $sum: 1 },
        totalSize: { $sum: '$fileSize' },
        lastUpload: { $max: '$createdAt' }
      }
    },
    { $sort: { count: -1 } },
    { $limit: limit },
    {
      $project: {
        project: '$_id',
        documentCount: '$count',
        totalSize: 1,
        lastUpload: 1,
        _id: 0
      }
    }
  ]);
}

async function getTopUsers(limit = 10) {
  return await User.aggregate([
    {
      $lookup: {
        from: 'documents',
        localField: '_id',
        foreignField: 'uploadedBy',
        as: 'uploadedDocuments'
      }
    },
    {
      $lookup: {
        from: 'searchhistories',
        localField: '_id',
        foreignField: 'userId',
        as: 'searchHistory'
      }
    },
    {
      $project: {
        name: 1,
        email: 1,
        documentCount: { $ifNull: [{ $size: { $ifNull: ['$uploadedDocuments', []] } }, 0] },
        searchCount: { $ifNull: [{ $size: { $ifNull: ['$searchHistory', []] } }, 0] },
        createdAt: 1
      }
    },
    {
      $addFields: {
        activityScore: {
          $add: [
            { $multiply: [{ $ifNull: [{ $size: { $ifNull: ['$uploadedDocuments', []] } }, 0] }, 10] },
            { $ifNull: [{ $size: { $ifNull: ['$searchHistory', []] } }, 0] }
          ]
        }
      }
    },
    { $sort: { activityScore: -1 } },
    { $limit: limit }
  ]);
}

async function getCategoryBreakdown() {
  return await Document.aggregate([
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        totalSize: { $sum: '$fileSize' }
      }
    },
    { $sort: { count: -1 } },
    {
      $project: {
        category: '$_id',
        count: 1,
        totalSize: 1,
        _id: 0
      }
    }
  ]);
}

async function getTeamBreakdown() {
  return await Document.aggregate([
    {
      $group: {
        _id: '$team',
        count: { $sum: 1 },
        totalSize: { $sum: '$fileSize' }
      }
    },
    { $sort: { count: -1 } },
    {
      $project: {
        team: '$_id',
        count: 1,
        totalSize: 1,
        _id: 0
      }
    }
  ]);
}

async function getUploadTrends(days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return await Document.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        },
        count: { $sum: 1 },
        totalSize: { $sum: '$fileSize' }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    {
      $project: {
        date: {
          $dateFromParts: {
            year: '$_id.year',
            month: '$_id.month',
            day: '$_id.day'
          }
        },
        count: 1,
        totalSize: 1,
        _id: 0
      }
    }
  ]);
}

async function getSearchTrends(days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return await SearchHistory.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        },
        count: { $sum: 1 },
        uniqueQueries: { $addToSet: '$query' }
      }
    },
    {
      $project: {
        date: {
          $dateFromParts: {
            year: '$_id.year',
            month: '$_id.month',
            day: '$_id.day'
          }
        },
        count: 1,
        uniqueQueries: { $ifNull: [{ $size: { $ifNull: ['$uniqueQueries', []] } }, 0] },
        _id: 0
      }
    },
    { $sort: { date: 1 } }
  ]);
}

export async function getUserAnalytics(userId) {
  try {
    const user = await UserInfo.findById(userId);
    if (!user) {
      throw new DatabaseError('User not found');
    }

    const [
      documentStats,
      searchStats,
      recentActivity
    ] = await Promise.all([
      getUserDocumentStats(userId),
      getUserSearchStats(userId),
      getUserRecentActivity(userId)
    ]);

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        createdAt: user.createdAt
      },
      documentStats,
      searchStats,
      recentActivity
    };
  } catch (error) {
    console.error('Error fetching user analytics:', error);
    throw new DatabaseError(`Failed to fetch user analytics: ${error.message}`);
  }
}

async function getUserDocumentStats(userId) {
  const stats = await Document.aggregate([
    {
      $match: { uploadedBy: new mongoose.Types.ObjectId(userId) }
    },
    {
      $group: {
        _id: null,
        totalDocuments: { $sum: 1 },
        totalSize: { $sum: '$fileSize' },
        avgSize: { $avg: '$fileSize' },
        categories: { $addToSet: '$category' },
        projects: { $addToSet: '$project' }
      }
    },
    {
      $project: {
        totalDocuments: 1,
        totalSize: 1,
        avgSize: 1,
        categoryCount: { $ifNull: [{ $size: { $ifNull: ['$categories', []] } }, 0] },
        projectCount: { $ifNull: [{ $size: { $ifNull: ['$projects', []] } }, 0] },
        _id: 0
      }
    }
  ]);

  return stats[0] || {
    totalDocuments: 0,
    totalSize: 0,
    avgSize: 0,
    categoryCount: 0,
    projectCount: 0
  };
}

async function getUserSearchStats(userId) {
  const stats = await SearchHistory.aggregate([
    {
      $match: { userId: userId }
    },
    {
      $group: {
        _id: null,
        totalSearches: { $sum: 1 },
        avgResults: { $avg: '$resultsCount' },
        uniqueQueries: { $addToSet: '$query' },
        lastSearch: { $max: '$createdAt' }
      }
    },
    {
      $project: {
        totalSearches: 1,
        avgResults: { $round: ['$avgResults', 2] },
        uniqueQueries: { $ifNull: [{ $size: { $ifNull: ['$uniqueQueries', []] } }, 0] },
        lastSearch: 1,
        _id: 0
      }
    }
  ]);

  return stats[0] || {
    totalSearches: 0,
    avgResults: 0,
    uniqueQueries: 0,
    lastSearch: null
  };
}

async function getUserRecentActivity(userId, limit = 20) {
  const [recentDocuments, recentSearches] = await Promise.all([
    Document.find({ uploadedBy: userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('fileName project category createdAt')
      .lean(),
    SearchHistory.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('query projectName createdAt resultsCount')
      .lean()
  ]);

  return {
    recentDocuments,
    recentSearches
  };
}
