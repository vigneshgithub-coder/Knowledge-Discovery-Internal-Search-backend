import mongoose from 'mongoose';

const chunkSchema = new mongoose.Schema(
  {
    document_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
      index: true,
    },
    chunk_index: {
      type: Number,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    embedding: {
      type: [Number],
      required: true,
    },
    token_count: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true, // This creates createdAt automatically
  }
);

// Index for faster queries
chunkSchema.index({ document_id: 1, chunk_index: 1 });

const Chunk = mongoose.model('Chunk', chunkSchema);

export default Chunk;

