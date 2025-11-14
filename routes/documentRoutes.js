import express from 'express';
import {
  listDocuments,
  getProjectList,
  removeDocument,
  getDocumentChunks,
} from '../controllers/documentController.js';

const router = express.Router();

router.get('/', listDocuments);
router.get('/projects', getProjectList);
router.get('/:id/chunks', getDocumentChunks);
router.delete('/:id', removeDocument);

export default router;
