import fs from 'fs';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import PPTX2JSON from 'pptx2json';
import { FileProcessingError } from './errors.js';

export async function extractTextFromPDF(filePath) {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (error) {
    throw new FileProcessingError(`Failed to extract text from PDF: ${error.message}`);
  }
}

export async function extractTextFromDocx(filePath) {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  } catch (error) {
    throw new FileProcessingError(`Failed to extract text from DOCX: ${error.message}`);
  }
}

export function extractTextFromTxt(filePath) {
  try {
    const text = fs.readFileSync(filePath, 'utf-8');
    return text;
  } catch (error) {
    throw new FileProcessingError(`Failed to extract text from TXT: ${error.message}`);
  }
}

export async function extractTextFromPPTX(filePath) {
  try {
    const pptx2json = new PPTX2JSON();
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
    
    // If no text was extracted, provide a default message
    if (!extractedText || extractedText.trim().length === 0) {
      extractedText = 'PowerPoint presentation uploaded. No text content found in slides.';
    }
    
    return extractedText.trim();
  } catch (error) {
    console.error('PPTX extraction error:', error);
    // Return a fallback message instead of throwing an error
    return `PowerPoint file processed. Text extraction failed: ${error.message}`;
  }
}

export async function extractTextByFileType(filePath, mimetype) {
  if (mimetype === 'application/pdf') {
    return extractTextFromPDF(filePath);
  } else if (
    mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return extractTextFromDocx(filePath);
  } else if (
    mimetype === 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ) {
    return extractTextFromPPTX(filePath);
  } else if (mimetype === 'text/plain') {
    return extractTextFromTxt(filePath);
  } else {
    throw new FileProcessingError(`Unsupported file type: ${mimetype}`);
  }
}
