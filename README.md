# Knowledge Discovery Backend

Express.js backend for the Knowledge Discovery & Internal Search System.

## Setup & Installation

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Ensure `.env` file is configured with MongoDB connection URI (see `.env.example`)

4. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

The server will run on `http://localhost:5000` by default.

## Project Structure

```
backend/
├── config/          # Configuration files (MongoDB connection)
├── controllers/     # Route handlers
├── middleware/      # Express middleware (multer, error handling)
├── models/          # MongoDB models (schema definitions)
├── routes/          # API route definitions
├── services/        # Business logic
├── utils/           # Utility functions (embedding, chunking, text extraction)
├── uploads/         # Temporary file storage
├── server.js        # Express app entry point
├── .env.example     # Environment variables template
└── .gitignore       # Git ignore file
```

## API Endpoints

### Upload Document
- **POST** `/api/upload`
- **Content-Type**: `multipart/form-data`
- **Fields**:
  - `file` (required): PDF, DOCX, or TXT file (max 10MB)
  - `projectName` (required): Project name
  - `tags` (optional): Comma-separated tags
- **Response**: Document metadata and chunk count

Example:
```bash
curl -X POST http://localhost:5000/api/upload \
  -F "file=@document.pdf" \
  -F "projectName=MyProject" \
  -F "tags=finance,Q4"
```

### Search Documents
- **POST** `/api/search`
- **Content-Type**: `application/json`
- **Body**:
  ```json
  {
    "query": "financial projections",
    "projectName": "MyProject"
  }
  ```
- **Response**: Top 5 matching chunks with similarity scores

### Get Suggestions
- **GET** `/api/search/suggestions?q=keyword`
- **Response**: Search suggestions based on query

### List Documents
- **GET** `/api/documents?projectName=MyProject`
- **Response**: List of all documents, optionally filtered by project

### Get Project List
- **GET** `/api/documents/projects`
- **Response**: Array of unique project names

### Get Document Chunks
- **GET** `/api/documents/:id/chunks`
- **Response**: All chunks for a specific document

### Delete Document
- **DELETE** `/api/documents/:id`
- **Response**: Success message

### Health Check
- **GET** `/api/health`
- **Response**: Server status

## Core Features

### Document Processing
1. Files are uploaded and stored temporarily
2. Text extraction based on file type (PDF, DOCX, TXT)
3. Text normalization and semantic chunking (300-600 word chunks with 50-word overlap)
4. Deterministic embedding generation for each chunk
5. Data persisted to MongoDB database

### Search Algorithm
1. Query converted to same deterministic embedding
2. Cosine similarity calculated against all chunk embeddings
3. Results ranked by similarity score
4. Top 5 chunks returned with metadata

### Embedding Function
The deterministic placeholder embedding function:
- Uses SHA-256 hashing of input text for consistency
- Generates 384-dimensional vectors
- Same input always produces same vector
- Enables reproducible semantic search

## Dependencies

- **express**: Web framework
- **cors**: Cross-origin resource sharing
- **mongoose**: MongoDB ODM
- **multer**: File upload handling
- **pdf-parse**: PDF text extraction
- **mammoth**: DOCX text extraction
- **dotenv**: Environment variable management
- **nodemon**: Development auto-reload

## Environment Variables

See `.env.example` for template. Required:
- `MONGODB_URI`: MongoDB connection URI (e.g., `mongodb://localhost:27017/knowledge-discovery`)
- `PORT`: Server port (default: 5000)
- `MAX_FILE_SIZE`: Max upload size in bytes (default: 10485760)

## Error Handling

All endpoints follow standard error response format:
```json
{
  "success": false,
  "error": {
    "name": "ValidationError",
    "message": "Descriptive error message"
  }
}
```

Supported error types:
- `ValidationError` (400)
- `UnauthorizedError` (401)
- `NotFoundError` (404)
- `FileProcessingError` (422)
- `DatabaseError` (500)

## Testing

### Upload a Document
```bash
curl -X POST http://localhost:5000/api/upload \
  -F "file=@sample.pdf" \
  -F "projectName=TestProject" \
  -F "tags=test,sample"
```

### Search
```bash
curl -X POST http://localhost:5000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "search term"}'
```

### List Documents
```bash
curl http://localhost:5000/api/documents
```

## Notes

- Files are temporarily stored in `/uploads` during processing and deleted after chunk extraction
- All text is normalized to remove extra whitespace and special characters
- Chunks maintain 50-word overlap with previous chunk for context continuity
- Search results are limited to top 5 most similar chunks
- Deterministic embedding ensures reproducible results for same input
- MongoDB collections are automatically created when documents are inserted
