import fs from 'fs';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
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

export async function extractTextByFileType(filePath, mimetype) {
  if (mimetype === 'application/pdf') {
    return extractTextFromPDF(filePath);
  } else if (
    mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return extractTextFromDocx(filePath);
  } else if (mimetype === 'text/plain') {
    return extractTextFromTxt(filePath);
  } else {
    throw new FileProcessingError(`Unsupported file type: ${mimetype}`);
  }
}
