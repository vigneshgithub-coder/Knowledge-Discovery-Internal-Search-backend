import mongoose from 'mongoose';

const userInfoSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    mobile: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true, // This creates createdAt and updatedAt automatically
  }
);

const UserInfo = mongoose.model('UserInfo', userInfoSchema);

export default UserInfo;
