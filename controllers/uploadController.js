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

    const { 
      projectName, 
      tags: tagsString, 
      userId, 
      category, 
      team 
    } = req.body;

    if (!projectName || projectName.trim() === '') {
      fs.unlinkSync(req.file.path);
      throw new ValidationError('Project name is required');
    }

    if (!userId || userId.trim() === '') {
      fs.unlinkSync(req.file.path);
      throw new ValidationError('User ID is required');
    }

    if (!category || category.trim() === '') {
      fs.unlinkSync(req.file.path);
      throw new ValidationError('Category is required');
    }

    if (!team || team.trim() === '') {
      fs.unlinkSync(req.file.path);
      throw new ValidationError('Team is required');
    }

    const tags = tagsString
      ? tagsString
          .split(',')
          .map((tag) => tag.trim())
          .filter((tag) => tag !== '')
      : [];

    // Get user info
    const User = await import('../models/User.js');
    let userInfo = null;
    try {
      userInfo = await User.default.findById(userId);
    } catch (userError) {
      console.error('Failed to fetch user info:', userError);
    }

    if (!userInfo) {
      fs.unlinkSync(req.file.path);
      throw new ValidationError('User not found');
    }

    // Extract text content from file
    let extractedContent = '';
    try {
      extractedContent = await extractTextFromFile(req.file.path, req.file.mimetype);
    } catch (extractionError) {
      console.error('Text extraction failed:', extractionError);
      extractedContent = `Failed to extract text from ${req.file.originalname}`;
    }

    // Auto-detect category if not provided or validate provided category
    let finalCategory = category;
    if (!category || category.trim() === '') {
      finalCategory = autoDetectCategory(extractedContent, req.file.originalname);
    }

    console.log('Creating document record...');
    const document = await createDocument(
      req.file.originalname,
      projectName.trim(),
      tags,
      req.file.size,
      userId.trim(),
      finalCategory,
      team,
      userInfo.name,
      userInfo.email,
      req.file.mimetype,
      req.file.path,
      extractedContent
    );
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
        fileName: document.fileName,
        projectName: document.project,
        category: document.category,
        team: document.team,
        tags: document.tags,
        uploadedByName: document.uploadedByName,
        uploadedByEmail: document.uploadedByEmail,
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

// Helper function to extract text from different file types
async function extractTextFromFile(filePath, mimeType) {
  const fs = await import('fs');
  
  try {
    if (mimeType === 'application/pdf') {
      const pdfParse = await import('pdf-parse');
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse.default(dataBuffer);
      return data.text;
    } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    } else if (mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
      const PPTX2JSON = await import('pptx2json');
      const pptx2json = new PPTX2JSON.default();
      const result = await pptx2json.toJson(filePath);
      
      // Extract text from all slides
      let extractedText = '';
      if (result && result.slides) {
        result.slides.forEach(slide => {
          if (slide.elements) {
            slide.elements.forEach(element => {
              if (element.text) {
                extractedText += element.text + ' ';
              }
            });
          }
        });
      }
      
      return extractedText.trim();
    } else if (mimeType === 'text/plain') {
      return fs.readFileSync(filePath, 'utf-8');
    } else {
      throw new Error(`Unsupported file type: ${mimeType}`);
    }
  } catch (error) {
    console.error('Error extracting text:', error);
    throw error;
  }
}

// Auto-detect category based on content and filename
function autoDetectCategory(content, filename) {
  const contentLower = content.toLowerCase();
  const filenameLower = filename.toLowerCase();

  // Marketing keywords
  const marketingKeywords = ['marketing', 'campaign', 'advertisement', 'brand', 'promotion', 'social media', 'seo', 'ppc'];
  // Sales keywords
  const salesKeywords = ['sales', 'revenue', 'customer', 'deal', 'pipeline', 'quota', 'commission', 'lead'];
  // Product keywords
  const productKeywords = ['product', 'feature', 'development', 'roadmap', 'specification', 'user story', 'sprint'];
  // Research keywords
  const researchKeywords = ['research', 'study', 'analysis', 'survey', 'data', 'findings', 'methodology'];
  // Strategy keywords
  const strategyKeywords = ['strategy', 'plan', 'goal', 'objective', 'vision', 'mission', 'roadmap', 'initiative'];

  const categories = [
    { name: 'marketing', keywords: marketingKeywords },
    { name: 'sales', keywords: salesKeywords },
    { name: 'product', keywords: productKeywords },
    { name: 'research', keywords: researchKeywords },
    { name: 'strategy', keywords: strategyKeywords }
  ];

  let bestCategory = 'marketing'; // default
  let maxScore = 0;

  for (const category of categories) {
    let score = 0;
    for (const keyword of category.keywords) {
      if (contentLower.includes(keyword) || filenameLower.includes(keyword)) {
        score++;
      }
    }
    if (score > maxScore) {
      maxScore = score;
      bestCategory = category.name;
    }
  }

  return bestCategory;
}

export function uploadProgress(req, res) {
  res.json({
    message: 'Upload endpoint is active. Use multipart/form-data with file field.',
  });
}
