import express from 'express';
import { upload } from '../middleware/multerConfig.js';
import { uploadFile, uploadProgress } from '../controllers/uploadController.js';
import { ValidationError } from '../utils/errors.js';

const router = express.Router();

// Handle multer errors
const handleMulterError = (err, req, res, next) => {
  if (err) {
    if (err instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        error: {
          name: 'ValidationError',
          message: err.message,
        },
      });
    }
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: {
          name: 'ValidationError',
          message: 'File size exceeds the maximum limit of 10MB',
        },
      });
    }
    return res.status(400).json({
      success: false,
      error: {
        name: 'ValidationError',
        message: err.message || 'File upload error',
      },
    });
  }
  next();
};

router.post('/', upload.single('file'), handleMulterError, uploadFile);
router.get('/progress', uploadProgress);

export default router;
