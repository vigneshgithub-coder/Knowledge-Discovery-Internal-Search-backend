import { getDocuments, getProjectNames, deleteDocument, getChunksByDocumentId } from '../services/documentService.js';
import { NotFoundError } from '../utils/errors.js';

export async function listDocuments(req, res, next) {
  try {
    const { projectName } = req.query;
    const documents = await getDocuments(projectName || null);

    // Convert MongoDB _id to id for frontend compatibility
    const formattedDocuments = documents.map((doc) => ({
      id: doc._id.toString(),
      filename: doc.filename,
      project_name: doc.project_name,
      tags: doc.tags || [],
      file_size: doc.file_size,
      upload_date: doc.upload_date,
      processed: doc.processed || false,
    }));

    res.json({
      success: true,
      documents: formattedDocuments,
      count: formattedDocuments.length,
    });
  } catch (error) {
    next(error);
  }
}

export async function getProjectList(req, res, next) {
  try {
    const projectNames = await getProjectNames();

    res.json({
      success: true,
      projects: projectNames,
    });
  } catch (error) {
    next(error);
  }
}

export async function removeDocument(req, res, next) {
  try {
    const { id } = req.params;

    if (!id) {
      throw new NotFoundError('Document ID is required');
    }

    await deleteDocument(id);

    res.json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function getDocumentChunks(req, res, next) {
  try {
    const { id } = req.params;

    if (!id) {
      throw new NotFoundError('Document ID is required');
    }

    const chunks = await getChunksByDocumentId(id);

    res.json({
      success: true,
      chunks,
      count: chunks.length,
    });
  } catch (error) {
    next(error);
  }
}
