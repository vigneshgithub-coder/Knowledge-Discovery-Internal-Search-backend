import { ValidationError } from '../utils/errors.js';
import { createDocument, processDocument } from '../services/documentService.js';
import fs from 'fs';

export async function uploadFile(req, res, next) {
  try {
    if (!req.file) {
      throw new ValidationError('No file provided');
    }

    console.log('Upload request received:', {
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
    });

    const { projectName, tags: tagsString } = req.body;

    if (!projectName || projectName.trim() === '') {
      fs.unlinkSync(req.file.path);
      throw new ValidationError('Project name is required');
    }

    const tags = tagsString
      ? tagsString
          .split(',')
          .map((tag) => tag.trim())
          .filter((tag) => tag !== '')
      : [];

    console.log('Creating document record...');
    const document = await createDocument(req.file.originalname, projectName.trim(), tags, req.file.size);
    console.log('Document created with ID:', document._id.toString());

    try {
      console.log('Processing document...');
      await processDocument(document._id, req.file.path, req.file.mimetype, req.file.originalname);
      console.log('Document processed successfully');
    } catch (processingError) {
      console.error('Document processing failed:', processingError);
      console.error('Error stack:', processingError.stack);
      // Delete the document record if processing fails
      try {
        const { deleteDocument } = await import('../services/documentService.js');
        await deleteDocument(document._id);
      } catch (deleteError) {
        console.error('Failed to delete document record:', deleteError);
      }
      fs.unlinkSync(req.file.path);
      throw processingError;
    }

    fs.unlinkSync(req.file.path);

    res.status(201).json({
      success: true,
      message: 'File uploaded and processed successfully',
      document: {
        id: document._id.toString(),
        filename: document.filename,
        projectName: document.project_name,
        tags: document.tags,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        console.error('Error deleting file:', e);
      }
    }
    next(error);
  }
}

export function uploadProgress(req, res) {
  res.json({
    message: 'Upload endpoint is active. Use multipart/form-data with file field.',
  });
}
