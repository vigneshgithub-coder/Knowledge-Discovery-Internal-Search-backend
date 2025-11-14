import Chunk from '../models/Chunk.js';
import Document from '../models/Document.js';
import { generateDeterministicEmbedding, cosineSimilarity } from '../utils/embedding.js';
import { DatabaseError } from '../utils/errors.js';

export async function searchChunks(query, projectName = null, limit = 5) {
  try {
    const queryEmbedding = generateDeterministicEmbedding(query);

    // Build the query
    let chunksQuery = Chunk.find();

    if (projectName) {
      // First find documents with the project name
      const documents = await Document.find({ project_name: projectName }).select('_id');
      const documentIds = documents.map((doc) => doc._id);
      
      if (documentIds.length === 0) {
        return []; // No documents found for this project
      }
      
      chunksQuery = chunksQuery.where('document_id').in(documentIds);
    }

    const allChunks = await chunksQuery.populate('document_id', 'filename project_name tags').lean();

    if (!allChunks) {
      throw new DatabaseError('Failed to fetch chunks for search');
    }

    // Calculate similarity scores
    // Note: allChunks is already a plain object (from .lean()), so no need for .toObject()
    const scoredResults = allChunks
      .map((chunk) => {
        try {
          // Ensure chunk is a plain object (handle edge cases with populate + lean)
          const plainChunk = chunk && typeof chunk.toObject === 'function' ? chunk.toObject() : chunk;
          const similarity = cosineSimilarity(queryEmbedding, plainChunk.embedding);
          return {
            ...plainChunk,
            similarity: Math.round(similarity * 100) / 100,
          };
        } catch (error) {
          console.error('Error processing chunk:', error);
          console.error('Chunk type:', typeof chunk);
          console.error('Chunk has toObject:', typeof chunk?.toObject);
          throw error;
        }
      })
      .filter((result) => result.similarity > 0)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    // Format results
    const formattedResults = scoredResults.map((result) => {
      let document = result.document_id;
      
      // Handle populated document (might still be a Mongoose doc even with lean)
      if (document && typeof document.toObject === 'function') {
        document = document.toObject();
      }
      
      // Handle both populated and non-populated document_id
      if (document && typeof document === 'object' && document._id) {
        return {
          id: result._id?.toString() || result._id,
          documentId: document._id.toString(),
          filename: document.filename,
          projectName: document.project_name,
          tags: document.tags || [],
          content: result.content,
          chunkIndex: result.chunk_index,
          similarity: result.similarity,
          snippet: result.content?.substring(0, 150) || '',
        };
      } else {
        // If document wasn't populated, we need to fetch it
        throw new DatabaseError('Document not populated in chunk result');
      }
    });

    return formattedResults;
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError(`Error searching chunks: ${error.message}`);
  }
}

export async function getChunksByDocumentId(documentId) {
  try {
    const chunks = await Chunk.find({ document_id: documentId })
      .sort({ chunk_index: 1 })
      .lean();

    if (!chunks) {
      throw new DatabaseError('Failed to fetch chunks');
    }

    return chunks;
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError(`Error fetching chunks: ${error.message}`);
  }
}
