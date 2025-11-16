import mongoose from 'mongoose';

const searchHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    userName: {
      type: String,
      required: false,
      trim: true,
    },
    userEmail: {
      type: String,
      required: false,
      trim: true,
      lowercase: true,
    },
    query: {
      type: String,
      required: true,
      trim: true,
    },
    projectName: {
      type: String,
      required: false,
      trim: true,
    },
    resultsCount: {
      type: Number,
      required: true,
      default: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false, // We only need createdAt
  }
);

// Index for faster queries
searchHistorySchema.index({ userId: 1, createdAt: -1 });
searchHistorySchema.index({ query: 1 });
searchHistorySchema.index({ projectName: 1 });

const SearchHistory = mongoose.model('SearchHistory', searchHistorySchema);

export default SearchHistory;
