import Document from '../models/Document.js';
import Chunk from '../models/Chunk.js';
import { extractTextByFileType } from '../utils/fileExtraction.js';
import { normalizeText, semanticChunking } from '../utils/chunking.js';
import { generateDeterministicEmbedding } from '../utils/embedding.js';
import { DatabaseError, FileProcessingError } from '../utils/errors.js';
import fs from 'fs';

export async function processDocument(documentId, filePath, mimeType, fileName) {
  try {
    console.log('Starting document processing:', { documentId, filePath, mimeType, fileName });
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new FileProcessingError(`File not found: ${filePath}`);
    }

    console.log('Extracting text from file...');
    const text = await extractTextByFileType(filePath, mimeType);
    
    if (!text || text.trim().length === 0) {
      throw new FileProcessingError('No text content extracted from file');
    }

    console.log(`Extracted ${text.length} characters of text`);
    console.log('Normalizing and chunking text...');
    const normalizedText = normalizeText(text);
    const chunks = semanticChunking(normalizedText);
    console.log(`Created ${chunks.length} chunks`);

    if (chunks.length === 0) {
      throw new FileProcessingError('No chunks created from document text');
    }

    const chunkRecords = chunks.map((chunk) => ({
      document_id: documentId,
      chunk_index: chunk.index,
      content: chunk.text,
      embedding: generateDeterministicEmbedding(chunk.text),
      token_count: chunk.text.split(/\s+/).length,
    }));

    console.log('Inserting chunks into database...');
    const insertedChunks = await Chunk.insertMany(chunkRecords);
    console.log(`Inserted ${insertedChunks.length} chunks`);

    if (!insertedChunks || insertedChunks.length === 0) {
      throw new DatabaseError('Failed to insert chunks');
    }

    console.log('Updating document status...');
    const updatedDoc = await Document.findByIdAndUpdate(
      documentId,
      { processed: true, updatedAt: new Date() },
      { new: true }
    );

    if (!updatedDoc) {
      throw new DatabaseError('Failed to update document status');
    }

    console.log('Document processing completed successfully');
    return { success: true, chunkCount: insertedChunks.length };
  } catch (error) {
    console.error('Error in processDocument:', error);
    if (error instanceof FileProcessingError || error instanceof DatabaseError) {
      throw error;
    }
    throw new FileProcessingError(`Error processing document: ${error.message}`);
  }
}

export async function createDocument(
  fileName, 
  projectName, 
  tags, 
  fileSize, 
  userId, 
  category, 
  team, 
  uploadedByName, 
  uploadedByEmail, 
  fileType, 
  filePath, 
  content
) {
  try {
    const document = new Document({
      fileName: fileName,
      fileType: fileType,
      fileUrl: filePath, // Will be updated with actual URL after upload
      fileSize: fileSize,
      content: content,
      category: category,
      project: projectName,
      team: team,
      uploadedByName: uploadedByName,
      uploadedByEmail: uploadedByEmail,
      uploadedBy: userId,
      tags: tags || [],
      processed: false,
    });

    const savedDocument = await document.save();

    if (!savedDocument) {
      throw new DatabaseError('Failed to create document record');
    }

    return savedDocument;
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError(`Error creating document: ${error.message}`);
  }
}

export async function getDocuments(projectName = null, userId = null) {
  try {
    let query = Document.find();

    if (userId) {
      query = query.where('uploadedBy').equals(userId);
    }

    if (projectName) {
      query = query.where('project').equals(projectName);
    }

    const documents = await query.sort({ createdAt: -1 });

    if (!documents) {
      throw new DatabaseError('Failed to fetch documents');
    }

    return documents;
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError(`Error fetching documents: ${error.message}`);
  }
}

export async function getProjectNames() {
  try {
    const documents = await Document.find().distinct('project_name').sort({ project_name: 1 });

    if (!documents) {
      throw new DatabaseError('Failed to fetch project names');
    }

    return documents.filter(Boolean);
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError(`Error fetching project names: ${error.message}`);
  }
}

export async function deleteDocument(documentId) {
  try {
    // Validate and convert documentId to ObjectId if it's a string
    const mongoose = (await import('mongoose')).default;
    
    if (!documentId) {
      throw new DatabaseError('Document ID is required');
    }

    let objectId;
    try {
      objectId = typeof documentId === 'string' ? new mongoose.Types.ObjectId(documentId) : documentId;
    } catch (error) {
      throw new DatabaseError(`Invalid document ID format: ${documentId}`);
    }

    // Delete chunks first (cascade delete)
    await Chunk.deleteMany({ document_id: objectId });

    // Delete document
    const result = await Document.findByIdAndDelete(objectId);

    if (!result) {
      throw new DatabaseError('Document not found');
    }

    return { success: true };
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError(`Error deleting document: ${error.message}`);
  }
}

export async function deleteChunksByDocumentId(documentId) {
  try {
    // Validate and convert documentId to ObjectId if it's a string
    const mongoose = (await import('mongoose')).default;
    
    if (!documentId) {
      throw new DatabaseError('Document ID is required');
    }

    let objectId;
    try {
      objectId = typeof documentId === 'string' ? new mongoose.Types.ObjectId(documentId) : documentId;
    } catch (error) {
      throw new DatabaseError(`Invalid document ID format: ${documentId}`);
    }

    const result = await Chunk.deleteMany({ document_id: objectId });

    if (!result) {
      throw new DatabaseError('Failed to delete chunks');
    }

    return { success: true };
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError(`Error deleting chunks: ${error.message}`);
  }
}

export async function getChunksByDocumentId(documentId) {
  try {
    // Validate and convert documentId to ObjectId if it's a string
    const mongoose = (await import('mongoose')).default;
    
    if (!documentId) {
      throw new DatabaseError('Document ID is required');
    }

    let objectId;
    try {
      objectId = typeof documentId === 'string' ? new mongoose.Types.ObjectId(documentId) : documentId;
    } catch (error) {
      throw new DatabaseError(`Invalid document ID format: ${documentId}`);
    }

    const chunks = await Chunk.find({ document_id: objectId })
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
