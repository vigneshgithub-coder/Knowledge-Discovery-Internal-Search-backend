import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema(
  {
    fileName: {
      type: String,
      required: true,
      trim: true,
    },
    fileType: {
      type: String,
      required: true,
      trim: true,
    },
    fileUrl: {
      type: String,
      required: true,
      trim: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      index: true,
      enum: ['marketing', 'sales', 'product', 'research', 'strategy'],
    },
    project: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    team: {
      type: String,
      required: true,
      trim: true,
      index: true,
      enum: ['marketing', 'sales', 'product', 'research', 'executive'],
    },
    uploadedByName: {
      type: String,
      required: true,
      trim: true,
    },
    uploadedByEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    processed: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true, // This creates createdAt and updatedAt automatically
  }
);

// Text index for full-text search
documentSchema.index({
  content: 'text',
  fileName: 'text',
  category: 'text',
  project: 'text'
});

// Compound indexes for better query performance
documentSchema.index({ project: 1, category: 1, createdAt: -1 });
documentSchema.index({ uploadedBy: 1, createdAt: -1 });
documentSchema.index({ team: 1, category: 1 });

const Document = mongoose.model('Document', documentSchema);

export default Document;

