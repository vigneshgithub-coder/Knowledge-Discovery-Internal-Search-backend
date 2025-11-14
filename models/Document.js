import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema(
  {
    filename: {
      type: String,
      required: true,
      trim: true,
    },
    project_name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    file_size: {
      type: Number,
      required: true,
    },
    upload_date: {
      type: Date,
      default: Date.now,
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

// Index for faster queries
documentSchema.index({ project_name: 1, processed: 1 });
documentSchema.index({ upload_date: -1 });

const Document = mongoose.model('Document', documentSchema);

export default Document;

