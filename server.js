import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { connectToMongoDB } from './config/mongodb.js';
import uploadRoutes from './routes/uploadRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import documentRoutes from './routes/documentRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use('/api/upload', uploadRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/documents', documentRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

// Connect to MongoDB and start server
connectToMongoDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  });
