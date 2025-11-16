import Document from '../models/Document.js';
import { DatabaseError } from '../utils/errors.js';

export async function searchDocuments(query, projectName = null, options = {}) {
  try {
    const {
      category,
      fileType,
      sortBy = 'relevance',
      limit = 20,
      skip = 0,
      userId
    } = options;

    console.log('Search parameters:', { query, projectName, userId });

    // Convert userId to ObjectId if provided
    const mongoose = await import('mongoose');
    const userObjectId = userId ? new mongoose.Types.ObjectId(userId) : null;

    // Build the search query
    const searchQuery = {};
    const orConditions = [];

    // Add text search conditions
    if (query && query.trim()) {
      orConditions.push(
        { content: { $regex: query, $options: 'i' } },
        { fileName: { $regex: query, $options: 'i' } }
      );
    }

    if (orConditions.length > 0) {
      searchQuery.$or = orConditions;
    }

    // Add userId filter if provided
    if (userObjectId) {
      searchQuery.uploadedBy = userObjectId;
    }

    if (fileType && fileType !== null) {
      searchQuery.fileType = fileType;
    }

    // Add filters
    if (projectName && projectName !== null) {
      searchQuery.project = projectName;
    }

    if (category && category !== null) {
      searchQuery.category = category;
    }

    // Build the aggregation pipeline
    let pipeline = [];

    // Match stage with search and filters
    pipeline.push({
      $match: searchQuery
    });

    // Sort based on preference
    if (sortBy === 'relevance' || sortBy === 'newest') {
      pipeline.push({
        $sort: { createdAt: -1 }
      });
    } else if (sortBy === 'oldest') {
      pipeline.push({
        $sort: { createdAt: 1 }
      });
    }

    // Project the desired fields
    pipeline.push({
      $project: {
        _id: 1,
        fileName: 1,
        fileType: 1,
        fileUrl: 1,
        fileSize: 1,
        content: 1,
        category: 1,
        project: 1,
        team: 1,
        uploadedByName: 1,
        uploadedByEmail: 1,
        createdAt: 1,
        score: 1
      }
    });

    // Pagination
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    // Execute the aggregation
    const results = await Document.aggregate(pipeline);

    // Format results for frontend
    return results.map(doc => ({
      _id: doc._id.toString(),
      fileName: doc.fileName,
      fileType: doc.fileType,
      fileUrl: doc.fileUrl,
      fileSize: doc.fileSize,
      content: doc.content,
      category: doc.category,
      project: doc.project,
      team: doc.team,
      uploadedByName: doc.uploadedByName,
      uploadedByEmail: doc.uploadedByEmail,
      uploadedAt: doc.createdAt,
      snippet: doc.content ? doc.content.substring(0, 200) + '...' : '',
      score: doc.score
    }));

  } catch (error) {
    console.error('Search error:', error);
    throw new DatabaseError(`Search failed: ${error.message}`);
  }
}

export async function getSearchSuggestions(query, limit = 10) {
  try {
    if (!query || query.length < 2) {
      return [];
    }

    // Get recent searches that match the query
    const SearchHistory = await import('../models/SearchHistory.js');
    const suggestions = await SearchHistory.default
      .find({
        query: { $regex: query, $options: 'i' }
      })
      .select('query')
      .sort({ createdAt: -1 })
      .limit(limit)
      .distinct('query');

    return suggestions;
  } catch (error) {
    console.error('Error getting search suggestions:', error);
    return [];
  }
}

export async function getPopularQueries(limit = 10) {
  try {
    const SearchHistory = await import('../models/SearchHistory.js');
    const popularQueries = await SearchHistory.default.aggregate([
      {
        $group: {
          _id: '$query',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: limit },
      {
        $project: {
          query: '$_id',
          count: 1,
          _id: 0
        }
      }
    ]);

    return popularQueries;
  } catch (error) {
    console.error('Error getting popular queries:', error);
    return [];
  }
}
