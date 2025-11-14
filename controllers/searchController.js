import { ValidationError } from '../utils/errors.js';
import { searchChunks } from '../services/searchService.js';

export async function search(req, res, next) {
  try {
    const { query, projectName } = req.body;

    if (!query || query.trim() === '') {
      throw new ValidationError('Search query is required');
    }

    const results = await searchChunks(query.trim(), projectName || null, 5);

    res.json({
      success: true,
      results,
      count: results.length,
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
