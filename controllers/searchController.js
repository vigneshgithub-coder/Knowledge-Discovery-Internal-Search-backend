import { ValidationError } from '../utils/errors.js';
import { searchDocuments, getSearchSuggestions, getPopularQueries } from '../services/advancedSearchService.js';
import SearchHistory from '../models/SearchHistory.js';
import User from '../models/User.js';

export async function search(req, res, next) {
  try {
    const { 
      query, 
      projectName, 
      userId, 
      category,
      fileType,
      sortBy = 'relevance',
      limit = 20,
      skip = 0
    } = req.body;

    if (!query || query.trim() === '') {
      throw new ValidationError('Search query is required');
    }

    const searchOptions = {
      category,
      fileType,
      sortBy,
      limit,
      skip,
      userId
    };

    const results = await searchDocuments(query.trim(), projectName || null, searchOptions);
    console.log('Search results to return:', results.length, results[0] ? results[0].fileName : 'No results');

    // Save search history if userId is provided
    if (userId) {
      try {
        let userName = 'Anonymous';
        let userEmail = 'anonymous@example.com';
        
        if (userId) {
          try {
            const userInfo = await User.findById(userId);
            if (userInfo) {
              userName = userInfo.name || 'Anonymous';
              userEmail = userInfo.email || 'anonymous@example.com';
            }
          } catch (userError) {
            console.error('Failed to fetch user info for search history:', userError);
            // Continue with default values if user info fetch fails
          }
        }
        await SearchHistory.create({
          userId,
          userName,
          userEmail,
          query: query.trim(),
          projectName: projectName || null,
          resultsCount: results.length,
        });
      } catch (historyError) {
        console.error('Failed to save search history:', historyError);
        // Don't fail the search request if history tracking fails
      }
    }

    res.json({
      success: true,
      results,
      count: results.length,
    });
  } catch (error) {
    next(error);
  }
}

export async function suggestions(req, res, next) {
  try {
    const { query } = req.query;

    if (!query || query.length < 2) {
      return res.json({
        success: true,
        suggestions: []
      });
    }

    const suggestions = await getSearchSuggestions(query, 10);

    res.json({
      success: true,
      suggestions
    });
  } catch (error) {
    next(error);
  }
}

export async function popular(req, res, next) {
  try {
    const popularQueries = await getPopularQueries(10);

    res.json({
      success: true,
      popularQueries
    });
  } catch (error) {
    next(error);
  }
}

export async function getSuggestions(req, res, next) {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.json({ suggestions: [] });
    }

    const results = await searchChunks(q.trim(), null, 3);

    const suggestions = results.map((r) => ({
      text: r.content.substring(0, 100),
      highlight: q,
    }));

    res.json({ suggestions });
  } catch (error) {
    next(error);
  }
}
